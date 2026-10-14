/** Ustawienia generowania AI z env (czytane przy użyciu, nie w buildzie). */

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

/** Domyślna liczba wariantów na zdjęcie (AI_VARIANTS_PER_PHOTO, 1–6). */
export function getVariantsPerPhoto(): number {
  return intFromEnv("AI_VARIANTS_PER_PHOTO", 3, 1, 6);
}

/** Maksymalny dłuższy bok obrazu wysyłanego do API (AI_MAX_INPUT_SIDE, 512–4096). */
export function getMaxInputSide(): number {
  return intFromEnv("AI_MAX_INPUT_SIDE", 2048, 512, 4096);
}

/** Tryb synchroniczny (AI_SYNC=1): żądanie czeka na koniec generowania. */
export function isAiSync(): boolean {
  return process.env.AI_SYNC === "1" || process.env.AI_SYNC === "true";
}

/** Ile generowań naraz w jednym procesie. */
export const AI_CONCURRENCY = 2;

/** Maksymalna liczba wariantów w jednym kliknięciu. */
export const MAX_VARIANTS_PER_REQUEST = 6;
