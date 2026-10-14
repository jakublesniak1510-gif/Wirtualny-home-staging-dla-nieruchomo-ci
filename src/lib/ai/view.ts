import type { AiVariant, PhotoResult } from "@prisma/client";
import { buildProxyUrl } from "@/lib/storage";

/** Dane wariantów do UI panelu (bez ścieżek magazynu – tylko adresy przez /api/files). */

export interface AiVariantView {
  id: string;
  status: string;
  provider: string;
  model: string;
  prompt: string;
  error: string | null;
  costCents: number | null;
  createdAt: string;
  finishedAt: string | null;
  url: string | null;
  thumbUrl: string | null;
  downloadUrl: string | null;
}

export interface PhotoResultView {
  id: string;
  label: string | null;
  source: string;
  url: string;
  thumbUrl: string;
  createdAt: string;
}

export function toVariantView(variant: AiVariant): AiVariantView {
  return {
    id: variant.id,
    status: variant.status,
    provider: variant.provider,
    model: variant.model,
    prompt: variant.prompt,
    error: variant.error,
    costCents: variant.costCents,
    createdAt: variant.createdAt.toISOString(),
    finishedAt: variant.finishedAt?.toISOString() ?? null,
    url: variant.key ? buildProxyUrl(variant.key) : null,
    thumbUrl: variant.key ? buildProxyUrl(variant.key, { width: 800 }) : null,
    downloadUrl: variant.key ? buildProxyUrl(variant.key, { downloadName: `wariant-ai-${variant.id.slice(-6)}.jpg` }) : null,
  };
}

export function toPhotoResultView(result: PhotoResult): PhotoResultView {
  return {
    id: result.id,
    label: result.label,
    source: result.source,
    url: buildProxyUrl(result.key),
    thumbUrl: buildProxyUrl(result.key, { width: 400 }),
    createdAt: result.createdAt.toISOString(),
  };
}
