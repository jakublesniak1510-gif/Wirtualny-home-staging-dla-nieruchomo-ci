const NBSP = " ";

/** Grupuje tysiące twardą spacją: 12900 → "12 900". */
function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/**
 * Formatuje kwotę w groszach jako złotówki: 3900 → "39,00 zł".
 * Separator przed „zł” i grupowanie tysięcy to twarda spacja (U+00A0),
 * żeby kwota nie łamała się między wierszami.
 */
export function formatPLN(grosze: number): string {
  if (!Number.isFinite(grosze)) {
    throw new RangeError("Kwota musi być liczbą skończoną.");
  }
  const rounded = Math.round(grosze);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const zl = Math.floor(abs / 100);
  const gr = String(abs % 100).padStart(2, "0");
  return `${sign}${groupThousands(zl)},${gr}${NBSP}zł`;
}

/**
 * Krótszy zapis do nagłówków/cenników: pełne złote bez groszy
 * (3900 → "39 zł"), a gdy są grosze – jak formatPLN (1950 → "19,50 zł").
 */
export function formatPLNShort(grosze: number): string {
  const rounded = Math.round(grosze);
  if (rounded % 100 !== 0) return formatPLN(rounded);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${groupThousands(Math.abs(rounded) / 100)}${NBSP}zł`;
}

/**
 * Polska odmiana rzeczownika przez liczbę.
 * pluralizePL(1, ["zdjęcie", "zdjęcia", "zdjęć"]) → "zdjęcie"
 * pluralizePL(3, ...) → "zdjęcia", pluralizePL(5, ...) → "zdjęć", pluralizePL(22, ...) → "zdjęcia"
 */
export function pluralizePL(
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return forms[0];
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return forms[1];
  }
  return forms[2];
}

/** "1 zdjęcie", "3 zdjęcia", "10 zdjęć". */
export function formatPhotoCount(count: number): string {
  return `${count}${NBSP}${pluralizePL(count, ["zdjęcie", "zdjęcia", "zdjęć"])}`;
}

/** Data po polsku, np. "14 października 2026". */
export function formatDatePL(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(d);
}

/** Data i godzina po polsku, np. "14.10.2026, 18:30". */
export function formatDateTimePL(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(d);
}
