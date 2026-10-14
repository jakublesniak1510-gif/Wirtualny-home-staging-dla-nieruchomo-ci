import { randomUUID } from "node:crypto";
import { jsonError } from "@/lib/api";
import { tmpPreviewUrl } from "@/lib/file-access";
import {
  ImageValidationError,
  getMaxUploadBytes,
  getMaxUploadMb,
  inspectImage,
  isAllowedMime,
} from "@/lib/images";
import { BodyTooLargeError, readFormDataLimited } from "@/lib/http-body";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/upload – multipart z jednym plikiem w polu `file`.
 * Odpowiedź: { tmpKey, width, height, size, previewUrl }.
 */
export async function POST(request: Request) {
  const limited = checkRateLimit("upload", request.headers);
  if (limited) return limited;

  const maxBytes = getMaxUploadBytes();
  let form: FormData;
  try {
    // Limit liczony na faktycznie przeczytanych bajtach – brak Content-Length (chunked) go nie omija.
    form = await readFormDataLimited(request, maxBytes + 64 * 1024);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return jsonError(413, `Plik jest za duży. Maksymalny rozmiar to ${getMaxUploadMb()} MB.`);
    }
    return jsonError(400, "Nie udało się odczytać przesłanego pliku. Spróbuj ponownie.");
  }
  const files = form.getAll("file");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return jsonError(400, "Prześlij dokładnie jeden plik w polu „file”.");
  }
  const file = files[0];
  if (file.size === 0) return jsonError(400, "Plik jest pusty.");
  if (file.size > maxBytes) {
    return jsonError(413, `Plik „${file.name}” jest za duży. Maksymalny rozmiar to ${getMaxUploadMb()} MB.`);
  }
  if (!isAllowedMime(file.type)) {
    return jsonError(415, `Plik „${file.name}” ma nieobsługiwany format. Dozwolone: JPG, PNG, WebP.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const info = await inspectImage(buffer);
    const tmpKey = `tmp/${randomUUID()}.${info.ext}`;
    await getStorage().put(tmpKey, buffer, info.mime);
    return Response.json({
      tmpKey,
      width: info.width,
      height: info.height,
      size: buffer.length,
      previewUrl: tmpPreviewUrl(tmpKey),
    });
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return jsonError(422, `„${file.name}”: ${error.message}`);
    }
    console.error("[upload] Błąd zapisu:", error);
    return jsonError(500, "Nie udało się zapisać pliku. Spróbuj ponownie za chwilę.");
  }
}
