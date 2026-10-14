import { randomInt } from "node:crypto";
import type { AiVariant } from "@prisma/client";
import { saveWatermarkedResult } from "@/lib/admin-results";
import type { SavedResult } from "@/lib/admin-results";
import { MAX_VARIANTS_PER_REQUEST, getMaxInputSide, getVariantsPerPhoto } from "@/lib/ai/config";
import { fitToOriginal, prepareAiInput } from "@/lib/ai/image-prep";
import { getDefaultProvider, getProvider } from "@/lib/ai/index";
import { buildStagingPrompt } from "@/lib/ai/prompt";
import { enqueue } from "@/lib/ai/queue";
import { AiProviderError } from "@/lib/ai/types";
import { prisma } from "@/lib/db";
import { parseAddons } from "@/lib/orders";
import { getStorage } from "@/lib/storage";

/**
 * Generowanie wariantów AI dla zdjęcia zamówienia i publikacja wybranego wariantu jako wyniku.
 * Warianty AI są BEZ znaku wodnego (tylko dla operatora, klucz `orders/<id>/ai/<variantId>.jpg`);
 * znak wodny dostaje dopiero opublikowany wynik.
 */

export type AiVariantStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

/** Po tylu minutach wariant „w toku” uznajemy za przerwany (np. restart serwera). */
export const STALE_VARIANT_MINUTES = 15;
const MAX_PROMPT_LENGTH = 4000;
const MAX_ERROR_LENGTH = 500;

export class AiGenerationError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AiGenerationError";
    this.status = status;
  }
}

export interface GenerateOptions {
  count?: number;
  providerId?: string;
  promptOverride?: string | null;
}

/** Domyślny prompt dla zamówienia (styl, dodatki, uwagi klienta). */
export function defaultPromptForOrder(order: { style: string; addons: string; notes: string | null }): string {
  return buildStagingPrompt({ style: order.style, addons: parseAddons(order.addons), notes: order.notes });
}

/** Tworzy rekordy PENDING (bez uruchamiania). Rzuca AiGenerationError z komunikatem PL. */
export async function createVariants(photoId: string, options: GenerateOptions = {}): Promise<AiVariant[]> {
  const photo = await prisma.photo.findUnique({ where: { id: photoId }, include: { order: true } });
  if (!photo) throw new AiGenerationError(404, "Nie znaleziono zdjęcia.");
  if (photo.order.status === "CANCELLED") throw new AiGenerationError(409, "Zamówienie jest anulowane.");
  if (photo.order.filesDeletedAt) throw new AiGenerationError(410, "Pliki tego zamówienia zostały już usunięte.");

  const provider = options.providerId ? getProvider(options.providerId) : getDefaultProvider();
  if (!provider) {
    throw new AiGenerationError(503, "Brak skonfigurowanego dostawcy AI – skonfiguruj klucz API w .env.");
  }
  if (!provider.isConfigured()) {
    throw new AiGenerationError(503, `${provider.label}: brak klucza API – skonfiguruj klucz API w .env.`);
  }
  const count = Math.min(MAX_VARIANTS_PER_REQUEST, Math.max(1, Math.round(options.count ?? getVariantsPerPhoto())));
  const prompt = (options.promptOverride?.trim() || defaultPromptForOrder(photo.order)).slice(0, MAX_PROMPT_LENGTH);

  return prisma.$transaction(
    Array.from({ length: count }, () =>
      prisma.aiVariant.create({
        data: { photoId, status: "PENDING", provider: provider.id, model: provider.model, prompt },
      }),
    ),
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof AiProviderError) return error.message;
  const detail = error instanceof Error ? error.message : String(error);
  return `Nie udało się wygenerować wariantu: ${detail}`;
}

/** Generuje jeden wariant (PENDING → RUNNING → DONE/FAILED). Nie rzuca – błąd trafia do rekordu. */
export async function processVariant(variantId: string): Promise<void> {
  const claimed = await prisma.aiVariant.updateMany({
    where: { id: variantId, status: "PENDING" },
    data: { status: "RUNNING" },
  });
  if (claimed.count !== 1) return;

  try {
    const variant = await prisma.aiVariant.findUniqueOrThrow({ where: { id: variantId }, include: { photo: true } });
    const provider = getProvider(variant.provider);
    if (!provider || !provider.isConfigured()) {
      throw new AiProviderError(variant.provider, "Dostawca AI nie jest już skonfigurowany – skonfiguruj klucz API w .env.");
    }
    const storage = getStorage();
    const original = await storage.get(variant.photo.originalKey);
    const prepared = await prepareAiInput(original, getMaxInputSide());
    const output = await provider.generate({
      image: prepared.buffer,
      mimeType: prepared.mimeType,
      prompt: variant.prompt,
      width: prepared.width,
      height: prepared.height,
      seed: randomInt(0, 2_147_483_647),
    });
    const fitted = await fitToOriginal(output.image, {
      width: variant.photo.width ?? prepared.width,
      height: variant.photo.height ?? prepared.height,
    });
    const key = `orders/${variant.photo.orderId}/ai/${variant.id}.jpg`;
    await storage.put(key, fitted.buffer, "image/jpeg");
    await prisma.aiVariant.update({
      where: { id: variant.id },
      data: {
        status: "DONE",
        key,
        costCents: output.costCents ?? null,
        externalId: output.externalId ?? null,
        error: null,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[ai] Wariant ${variantId} – błąd:`, error);
    await prisma.aiVariant
      .update({
        where: { id: variantId },
        data: { status: "FAILED", error: errorMessage(error).slice(0, MAX_ERROR_LENGTH), finishedAt: new Date() },
      })
      .catch(() => undefined);
  }
}

/** Uruchamia warianty w kolejce (maks. 2 naraz); obietnica kończy się, gdy wszystkie są gotowe. */
export async function runVariants(variantIds: readonly string[]): Promise<void> {
  await Promise.all(variantIds.map((id) => enqueue(() => processVariant(id))));
}

/** Tworzy warianty i czeka na ich wygenerowanie (tryb synchroniczny / skrypty). */
export async function generateVariantsForPhoto(photoId: string, options: GenerateOptions = {}): Promise<AiVariant[]> {
  const created = await createVariants(photoId, options);
  await runVariants(created.map((variant) => variant.id));
  return prisma.aiVariant.findMany({ where: { id: { in: created.map((v) => v.id) } }, orderBy: { createdAt: "asc" } });
}

/** Warianty „w toku” starsze niż STALE_VARIANT_MINUTES → FAILED (proces mógł zginąć). */
export async function recoverStaleVariants(photoId?: string, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_VARIANT_MINUTES * 60_000);
  const result = await prisma.aiVariant.updateMany({
    where: { ...(photoId ? { photoId } : {}), status: { in: ["PENDING", "RUNNING"] }, createdAt: { lt: cutoff } },
    data: {
      status: "FAILED",
      error: "Generowanie przerwane (serwer został zrestartowany lub przekroczono czas). Wygeneruj ponownie.",
      finishedAt: now,
    },
  });
  return result.count;
}

export interface PublishOptions {
  label?: string | null;
  asPrimary: boolean;
}

/**
 * Publikuje gotowy wariant: nakłada znak wodny i zapisuje jako wynik główny (Photo.resultKey)
 * lub dodatkowy wariant dla klienta (PhotoResult, source "ai"). PAID → IN_PROGRESS przy pierwszym wyniku.
 */
export async function publishVariant(variantId: string, options: PublishOptions): Promise<SavedResult> {
  const variant = await prisma.aiVariant.findUnique({
    where: { id: variantId },
    include: { photo: { include: { order: { select: { status: true, filesDeletedAt: true } } } } },
  });
  if (!variant) throw new AiGenerationError(404, "Nie znaleziono wariantu.");
  if (variant.status !== "DONE" || !variant.key) {
    throw new AiGenerationError(409, "Wariant nie jest jeszcze gotowy.");
  }
  if (variant.photo.order.status === "CANCELLED") throw new AiGenerationError(409, "Zamówienie jest anulowane.");
  if (variant.photo.order.filesDeletedAt) throw new AiGenerationError(410, "Pliki tego zamówienia zostały już usunięte.");
  const buffer = await getStorage().get(variant.key);
  return saveWatermarkedResult(variant.photo, buffer, {
    asPrimary: options.asPrimary,
    label: options.label,
    source: "ai",
  });
}

/** Usuwa wariant AI (plik + rekord). */
export async function deleteVariant(variantId: string): Promise<void> {
  const variant = await prisma.aiVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new AiGenerationError(404, "Nie znaleziono wariantu.");
  if (variant.key) await getStorage().delete(variant.key).catch(() => undefined);
  await prisma.aiVariant.delete({ where: { id: variantId } });
}
