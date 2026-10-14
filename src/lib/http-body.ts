/**
 * Odczyt treści żądania z twardym limitem bajtów. Route handlery w Next.js nie mają własnego
 * limitu rozmiaru body, a nagłówek Content-Length można pominąć (Transfer-Encoding: chunked) –
 * `request.formData()` / `request.text()` wczytałyby wtedy do pamięci dowolnie dużo danych.
 */

export class BodyTooLargeError extends Error {
  readonly maxBytes: number;
  constructor(maxBytes: number) {
    super(`Treść żądania przekracza ${maxBytes} B.`);
    this.name = "BodyTooLargeError";
    this.maxBytes = maxBytes;
  }
}

/**
 * Czyta całe body, przerywając po przekroczeniu `maxBytes` (rzuca BodyTooLargeError).
 * Zadeklarowany Content-Length większy od limitu odrzucamy bez czytania.
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<Buffer> {
  const declared = Number(request.headers.get("content-length") ?? Number.NaN);
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError(maxBytes);
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLargeError(maxBytes);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, total);
}

/** Multipart z limitem rozmiaru (FormData parsowane z już ograniczonego bufora). */
export async function readFormDataLimited(request: Request, maxBytes: number): Promise<FormData> {
  const body = await readBodyLimited(request, maxBytes);
  const contentType = request.headers.get("content-type") ?? "";
  return new Response(new Uint8Array(body), { headers: { "content-type": contentType } }).formData();
}
