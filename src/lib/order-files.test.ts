import { describe, expect, it } from "vitest";
import { formatRemaining } from "@/components/order/remaining";
import {
  buildReadmeText,
  buildVariantZipEntries,
  listPhotoVariants,
  referralPath,
  variantFileName,
  variantLetter,
} from "@/lib/orders";

const at = (iso: string) => new Date(iso);

describe("warianty wyników", () => {
  it("litery wariantów", () => {
    expect([0, 1, 25, 26, 27].map(variantLetter)).toEqual(["A", "B", "Z", "AA", "AB"]);
  });

  it("główny wynik to wariant A, dodatkowe wg sortOrder i daty", () => {
    const variants = listPhotoVariants({
      id: "p1",
      resultKey: "orders/o/results/1.jpg",
      results: [
        { id: "r2", key: "orders/o/results/1-c.jpg", label: null, sortOrder: 2, createdAt: at("2026-10-14T10:00:00Z") },
        { id: "r1", key: "orders/o/results/1-b.webp", label: " Jaśniejsza sofa ", sortOrder: 1, createdAt: at("2026-10-14T11:00:00Z") },
      ],
    });
    expect(variants.map((v) => [v.letter, v.label, v.isMain])).toEqual([
      ["A", "Wariant A", true],
      ["B", "Wariant B – Jaśniejsza sofa", false],
      ["C", "Wariant C", false],
    ]);
  });

  it("bez głównego wyniku dodatkowe warianty zaczynają od A; duplikat klucza pomijany", () => {
    expect(listPhotoVariants({ id: "p", resultKey: null, results: [] })).toEqual([]);
    const variants = listPhotoVariants({
      id: "p",
      resultKey: "k.jpg",
      results: [{ id: "x", key: "k.jpg", sortOrder: 0, createdAt: at("2026-10-14T10:00:00Z") }],
    });
    expect(variants).toHaveLength(1);
  });
});

describe("nazwy plików ZIP", () => {
  it("format WS-…-01-wariant-A-wizualizacja.jpg", () => {
    expect(variantFileName("WS-ABCD1234", 0, "A", "orders/x/results/1.JPG")).toBe("WS-ABCD1234-01-wariant-A-wizualizacja.jpg");
    expect(variantFileName("WS-ABCD1234", 11, "B", "orders/x/results/12.webp")).toBe(
      "WS-ABCD1234-12-wariant-B-wizualizacja.webp",
    );
    expect(variantFileName("WS-ABCD1234", 0, "A", "orders/x/results/bez-rozszerzenia")).toBe(
      "WS-ABCD1234-01-wariant-A-wizualizacja.jpg",
    );
  });

  it("ZIP zawiera wszystkie warianty wszystkich zdjęć z unikalnymi nazwami", () => {
    const entries = buildVariantZipEntries("WS-ABCD1234", [
      {
        id: "p1",
        resultKey: "orders/o/r/1.jpg",
        results: [{ id: "r1", key: "orders/o/r/1-b.jpg", sortOrder: 0, createdAt: at("2026-10-14T10:00:00Z") }],
      },
      { id: "p2", resultKey: null, results: [] },
      { id: "p3", resultKey: "orders/o/r/3.png", results: [] },
    ]);
    expect(entries.map((e) => e.name)).toEqual([
      "WS-ABCD1234-01-wariant-A-wizualizacja.jpg",
      "WS-ABCD1234-01-wariant-B-wizualizacja.jpg",
      "WS-ABCD1234-03-wariant-A-wizualizacja.png",
    ]);
    expect(new Set(entries.map((e) => e.name)).size).toBe(entries.length);
  });

  it("CZYTAJ.txt: numer, styl, oznaczenie, zasady, regulamin; CRLF i BOM", () => {
    const text = buildReadmeText({
      orderNumber: "WS-ABCD1234",
      styleName: "Skandynawski",
      photoCount: 2,
      fileNames: ["WS-ABCD1234-01-wariant-A-wizualizacja.jpg"],
      termsUrl: "https://example.pl/regulamin",
      statusUrl: "https://example.pl/zamowienie/abc",
    });
    expect(text.startsWith("\uFEFF")).toBe(true);
    expect(text).toContain("\r\n");
    for (const part of ["WS-ABCD1234", "Skandynawski", "„wizualizacja”", "ZASADY PUBLIKACJI", "https://example.pl/regulamin"]) {
      expect(text).toContain(part);
    }
  });
});

describe("pozostałe helpery", () => {
  it("formatRemaining", () => {
    const now = at("2026-10-14T10:00:00Z");
    expect(formatRemaining(at("2026-10-14T13:25:00Z"), now)).toBe("3 h 25 min");
    expect(formatRemaining(at("2026-10-14T10:00:30Z"), now)).toBe("1 min");
    expect(formatRemaining(at("2026-10-14T10:45:00Z"), now)).toBe("45 min");
    expect(formatRemaining(now, now)).toBeNull();
    expect(formatRemaining(at("2026-10-14T09:00:00Z"), now)).toBeNull();
  });

  it("link polecający koduje e-mail", () => {
    expect(referralPath(" Jan+biuro@Example.pl ")).toBe("/zamow?polecenie=jan%2Bbiuro%40example.pl");
  });
});
