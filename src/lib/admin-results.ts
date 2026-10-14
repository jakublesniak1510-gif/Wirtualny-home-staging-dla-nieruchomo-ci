import { prisma } from "@/lib/db";
import { notifyOrderInProgressSafe } from "@/lib/admin-notify";
import { getStorage } from "@/lib/storage";
import { applyWatermark } from "@/lib/watermark";

/**
 * Zapis gotowych wyników (zawsze ze znakiem wodnym „wizualizacja”) – wspólne dla ręcznego
 * uploadu i publikacji wariantu AI.
 */

export const MAX_RESULT_LABEL = 80;

export interface ResultPhoto {
  id: string;
  orderId: string;
  sortOrder: number;
  resultKey: string | null;
}

export interface SavedResult {
  key: string;
  width: number;
  height: number;
  /** Id nowego PhotoResult (gdy zapisano jako wariant dla klienta). */
  photoResultId?: string;
}

export function normalizeLabel(label: string | null | undefined): string | null {
  const value = label?.replace(/\s+/g, " ").trim().slice(0, MAX_RESULT_LABEL);
  return value ? value : null;
}

/**
 * Nakłada znak wodny i zapisuje: jako wynik główny (Photo.resultKey – poprzedni plik usuwany)
 * albo jako dodatkowy wariant (PhotoResult). Przy pierwszym wyniku zmienia PAID → IN_PROGRESS.
 */
export async function saveWatermarkedResult(
  photo: ResultPhoto,
  input: Buffer,
  options: { asPrimary: boolean; label?: string | null; source: "manual" | "ai" },
): Promise<SavedResult> {
  const result = await applyWatermark(input);
  const storage = getStorage();
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const key = options.asPrimary
    ? `orders/${photo.orderId}/result/${photo.sortOrder + 1}-${stamp}.${result.ext}`
    : `orders/${photo.orderId}/result/${photo.sortOrder + 1}-wariant-${stamp}.${result.ext}`;
  await storage.put(key, result.buffer, result.mime);

  let photoResultId: string | undefined;
  if (options.asPrimary) {
    await prisma.photo.update({ where: { id: photo.id }, data: { resultKey: key, resultUploadedAt: new Date() } });
    if (photo.resultKey && photo.resultKey !== key) {
      await storage.delete(photo.resultKey).catch(() => undefined);
    }
  } else {
    const count = await prisma.photoResult.count({ where: { photoId: photo.id } });
    const created = await prisma.photoResult.create({
      data: {
        photoId: photo.id,
        key,
        label: normalizeLabel(options.label),
        source: options.source,
        sortOrder: count,
      },
    });
    photoResultId = created.id;
  }
  await markOrderInProgressIfPaid(photo.orderId);
  return { key, width: result.width, height: result.height, photoResultId };
}

/** PAID → IN_PROGRESS (atomowo) + e-mail do klienta. Zwraca true, gdy status się zmienił. */
export async function markOrderInProgressIfPaid(orderId: string): Promise<boolean> {
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: "PAID" },
    data: { status: "IN_PROGRESS" },
  });
  if (updated.count !== 1) return false;
  await notifyOrderInProgressSafe(orderId);
  return true;
}
