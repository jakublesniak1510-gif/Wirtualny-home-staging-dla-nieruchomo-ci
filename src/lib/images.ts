import sharp from "sharp";

/** Walidacja i obróbka obrazów (sharp). */

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** Minimalny krótszy bok zdjęcia w pikselach. */
export const MIN_SHORT_SIDE = 800;

/** Dozwolone szerokości miniatur generowanych w /api/files (ochrona przed nadużyciem). */
export const THUMB_WIDTHS = [200, 400, 800, 1600] as const;

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

/** Maksymalny rozmiar pojedynczego pliku (MAX_UPLOAD_MB, domyślnie 25 MB). */
export function getMaxUploadMb(): number {
  const value = Number(process.env.MAX_UPLOAD_MB);
  return Number.isFinite(value) && value > 0 ? value : 25;
}

export function getMaxUploadBytes(): number {
  return Math.floor(getMaxUploadMb() * 1024 * 1024);
}

export function isAllowedMime(mime: string): mime is AllowedImageMime {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
}

export interface ImageInfo {
  mime: AllowedImageMime;
  ext: "jpg" | "png" | "webp";
  /** Wymiary po uwzględnieniu orientacji EXIF. */
  width: number;
  height: number;
}

const FORMATS: Record<string, { mime: AllowedImageMime; ext: ImageInfo["ext"] }> = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
};

/**
 * Sprawdza rzeczywisty format pliku (nagłówek/„magic bytes” przez sharp) i wymiary.
 * Rzuca ImageValidationError z komunikatem dla użytkownika.
 */
export async function inspectImage(
  buffer: Buffer,
  options: { minShortSide?: number } = {},
): Promise<ImageInfo> {
  const minShortSide = options.minShortSide ?? MIN_SHORT_SIDE;
  const metadata = await sharp(buffer)
    .metadata()
    .catch(() => null);
  if (!metadata) {
    throw new ImageValidationError("Plik nie jest poprawnym obrazem. Wgraj zdjęcie JPG, PNG lub WebP.");
  }
  const format = metadata.format ? FORMATS[metadata.format] : undefined;
  if (!format) {
    throw new ImageValidationError("Nieobsługiwany format pliku. Wgraj zdjęcie JPG, PNG lub WebP.");
  }
  if (!metadata.width || !metadata.height) {
    throw new ImageValidationError("Nie udało się odczytać wymiarów zdjęcia.");
  }
  // Orientacje EXIF 5–8 oznaczają obrót o 90°.
  const rotated = (metadata.orientation ?? 1) >= 5;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  if (Math.min(width, height) < minShortSide) {
    throw new ImageValidationError(
      `Zdjęcie ma za niską rozdzielczość (${width}×${height} px). Krótszy bok musi mieć co najmniej ${minShortSide} px – wgraj oryginał z aparatu lub telefonu, nie zrzut ekranu ani miniaturę.`,
    );
  }
  return { mime: format.mime, ext: format.ext, width, height };
}

/** Miniatura WebP o podanej szerokości (z obrotem wg EXIF, bez powiększania). */
export async function makeThumbnail(buffer: Buffer, width: number): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Najbliższa dozwolona szerokość miniatury (lub null, gdy parametr niepoprawny). */
export function pickThumbWidth(raw: string | null): number | null {
  if (!raw) return null;
  const requested = Number(raw);
  if (!Number.isFinite(requested) || requested <= 0) return null;
  return THUMB_WIDTHS.find((w) => w >= requested) ?? THUMB_WIDTHS[THUMB_WIDTHS.length - 1];
}
