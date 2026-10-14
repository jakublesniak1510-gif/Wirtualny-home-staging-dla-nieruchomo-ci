/**
 * Dopasowanie plików z uploadu zbiorczego do zdjęć zamówienia.
 * 1) Po numerze w nazwie: samodzielny token liczbowy 1–3 cyfry, np. `01.jpg`, `salon_02.png`,
 *    `WS-ABCD1234-03-wizualizacja.jpg` (bierzemy ostatni pasujący token z zakresu 1..liczba zdjęć).
 *    Tryb używany tylko, gdy KAŻDY plik ma inny, poprawny numer.
 * 2) W przeciwnym razie po kolejności nazw (sortowanie naturalne: 2 < 10).
 * Operator widzi podgląd i może poprawić przypisania przed zatwierdzeniem.
 */

export type MatchMode = "number" | "order";

export interface FileAssignment {
  fileIndex: number;
  /** Indeks zdjęcia (0-based) albo null, gdy plik nadmiarowy. */
  photoIndex: number | null;
}

export interface MatchResult {
  mode: MatchMode;
  assignments: FileAssignment[];
}

/** Numer zdjęcia (1-based) z nazwy pliku lub null. */
export function extractPhotoNumber(fileName: string, photoCount: number): number | null {
  const base = fileName.replace(/\.[A-Za-z0-9]+$/, "");
  const tokens = base.split(/[^A-Za-z0-9]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    if (/^\d{1,3}$/.test(token)) {
      const value = Number(token);
      if (value >= 1 && value <= photoCount) return value;
    }
  }
  return null;
}

const collator = new Intl.Collator("pl", { numeric: true, sensitivity: "base" });

export function matchFilesToPhotos(fileNames: readonly string[], photoCount: number): MatchResult {
  const numbers = fileNames.map((name) => extractPhotoNumber(name, photoCount));
  const valid = numbers.every((n): n is number => n !== null);
  if (fileNames.length > 0 && valid && new Set(numbers).size === numbers.length) {
    return {
      mode: "number",
      assignments: numbers.map((n, fileIndex) => ({ fileIndex, photoIndex: (n as number) - 1 })),
    };
  }
  const sorted = fileNames
    .map((name, fileIndex) => ({ name, fileIndex }))
    .sort((a, b) => collator.compare(a.name, b.name));
  const assignments: FileAssignment[] = fileNames.map((_, fileIndex) => ({ fileIndex, photoIndex: null }));
  sorted.forEach((entry, position) => {
    assignments[entry.fileIndex] = { fileIndex: entry.fileIndex, photoIndex: position < photoCount ? position : null };
  });
  return { mode: "order", assignments };
}

/** Czy któreś zdjęcie ma przypisany więcej niż jeden plik. */
export function findDuplicateTargets(assignments: readonly FileAssignment[]): number[] {
  const seen = new Map<number, number>();
  for (const { photoIndex } of assignments) {
    if (photoIndex === null) continue;
    seen.set(photoIndex, (seen.get(photoIndex) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([index]) => index);
}
