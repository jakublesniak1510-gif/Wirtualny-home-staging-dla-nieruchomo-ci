import { prisma } from "@/lib/db";
import { sign, verifySignature } from "@/lib/secrets";
import { buildProxyUrl, sanitizeKey } from "@/lib/storage";
import type { UrlOptions } from "@/lib/storage";

/** Autoryzacja dostępu do plików serwowanych przez /api/files/[...key]. */

const TMP_CONTEXT = "tmp-file";

/** Podpisany adres podglądu pliku tymczasowego (dla osoby, która go właśnie wgrała). */
export function tmpPreviewUrl(key: string, width = 400): string {
  return buildProxyUrl(key, { sig: sign(TMP_CONTEXT, sanitizeKey(key)), width });
}

/** Adres pliku zamówienia dla klienta (z publicznym tokenem). */
export function orderFileUrl(key: string, token: string, options: Omit<UrlOptions, "token"> = {}): string {
  return buildProxyUrl(key, { ...options, token });
}

export interface FileAccessInput {
  key: string;
  isAdmin: boolean;
  token?: string | null;
  sig?: string | null;
}

/**
 * Admin – wszystko. Plik tymczasowy – poprawny podpis. Plik zamówienia – poprawny
 * publicToken i klucz należący do zdjęć TEGO zamówienia (oryginał, wynik główny lub wariant
 * PhotoResult). Warianty AI (AiVariant) NIE są dostępne dla klienta.
 */
export async function canAccessFile({ key, isAdmin, token, sig }: FileAccessInput): Promise<boolean> {
  if (isAdmin) return true;
  if (key.startsWith("tmp/")) {
    return Boolean(sig) && verifySignature(TMP_CONTEXT, key, sig ?? "");
  }
  if (!token || !key.startsWith("orders/")) return false;
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      photos: { select: { originalKey: true, resultKey: true, results: { select: { key: true } } } },
    },
  });
  if (!order || !key.startsWith(`orders/${order.id}/`)) return false;
  return order.photos.some(
    (photo) =>
      photo.originalKey === key ||
      photo.resultKey === key ||
      photo.results.some((result) => result.key === key),
  );
}
