import { jsonError } from "@/lib/api";
import { getMaxUploadBytes, getMaxUploadMb, inspectImage, isAllowedMime } from "@/lib/images";

/** Odczyt pliku wyniku z multipart (`file`) dla tras panelu – limity jak w dotychczasowym uploadzie. */
export async function readResultUpload(request: Request): Promise<{ buffer: Buffer; form: FormData } | Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Nie udało się odczytać przesłanego pliku.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError(400, "Wybierz plik z wizualizacją.");
  if (file.size > getMaxUploadBytes() * 2) return jsonError(413, `Plik jest za duży (maks. ${getMaxUploadMb() * 2} MB).`);
  if (!isAllowedMime(file.type)) return jsonError(415, "Dozwolone formaty: JPG, PNG, WebP.");
  const buffer = Buffer.from(await file.arrayBuffer());
  await inspectImage(buffer, { minShortSide: 1 });
  return { buffer, form };
}
