import sharp from "sharp";

/** Przygotowanie zdjęcia do API (zmniejszenie) i dopasowanie wyniku do proporcji oryginału. */

export interface PreparedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

/** Docelowy maksymalny rozmiar pliku wejściowego (Replicate zaleca data URL < 1 MB). */
export const MAX_INPUT_BYTES = 950 * 1024;

/**
 * Obraca wg EXIF, zmniejsza tak, by dłuższy bok ≤ maxSide, zapisuje jako JPEG
 * (bez metadanych, m.in. GPS). Obniża jakość/rozmiar, aż plik zmieści się w MAX_INPUT_BYTES.
 */
export async function prepareAiInput(input: Buffer, maxSide: number): Promise<PreparedImage> {
  let side = maxSide;
  for (const quality of [88, 80, 72, 64, 64, 64]) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= MAX_INPUT_BYTES || side <= 768) {
      return { buffer: data, mimeType: "image/jpeg", width: info.width, height: info.height };
    }
    if (quality === 64) side = Math.round(side * 0.8);
  }
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 64 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, mimeType: "image/jpeg", width: info.width, height: info.height };
}

/**
 * Dopasowuje wynik do proporcji oryginału. Modele, które zmieniają proporcje (np. gpt-image-1
 * zwraca 1536×1024), skalują CAŁY kadr – odwrotne przeskalowanie („fill”) przywraca geometrię
 * bez przycinania fragmentów pokoju. Dłuższy bok wyniku = min(dłuższy bok oryginału, wyniku).
 * Zwraca JPEG (q 90).
 */
export async function fitToOriginal(
  output: Buffer,
  original: { width: number; height: number },
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const meta = await sharp(output).metadata();
  const outLong = Math.max(meta.width ?? 0, meta.height ?? 0) || Math.max(original.width, original.height);
  const origLong = Math.max(original.width, original.height);
  const targetLong = Math.min(origLong, outLong);
  const scale = targetLong / origLong;
  const width = Math.max(1, Math.round(original.width * scale));
  const height = Math.max(1, Math.round(original.height * scale));
  const buffer = await sharp(output)
    .rotate()
    .resize({ width, height, fit: "fill" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  return { buffer, width, height };
}
