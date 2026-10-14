import { describe, expect, it } from "vitest";
import { extractPhotoNumber, findDuplicateTargets, matchFilesToPhotos } from "@/lib/admin-bulk-match";

describe("extractPhotoNumber", () => {
  it("czyta numer zdjęcia z różnych nazw", () => {
    expect(extractPhotoNumber("01.jpg", 5)).toBe(1);
    expect(extractPhotoNumber("salon_02.png", 5)).toBe(2);
    expect(extractPhotoNumber("WS-ABCD1234-03-wizualizacja.jpg", 5)).toBe(3);
    expect(extractPhotoNumber("zdjecie 4 final.webp", 5)).toBe(4);
  });

  it("ignoruje liczby spoza zakresu i bez separatorów", () => {
    expect(extractPhotoNumber("IMG_2034.jpg", 5)).toBeNull();
    expect(extractPhotoNumber("salon.jpg", 5)).toBeNull();
    expect(extractPhotoNumber("07.jpg", 5)).toBeNull();
    expect(extractPhotoNumber("v2salon.jpg", 5)).toBeNull();
  });
});

describe("matchFilesToPhotos", () => {
  it("po numerze, gdy każdy plik ma inny poprawny numer (dowolna kolejność wyboru)", () => {
    const result = matchFilesToPhotos(["wynik-02.jpg", "wynik-01.jpg", "wynik-03.jpg"], 3);
    expect(result.mode).toBe("number");
    expect(result.assignments).toEqual([
      { fileIndex: 0, photoIndex: 1 },
      { fileIndex: 1, photoIndex: 0 },
      { fileIndex: 2, photoIndex: 2 },
    ]);
  });

  it("po kolejności nazw (sortowanie naturalne), gdy brak numerów", () => {
    const result = matchFilesToPhotos(["salon-b.jpg", "salon-a.jpg"], 2);
    expect(result.mode).toBe("order");
    expect(result.assignments).toEqual([
      { fileIndex: 0, photoIndex: 1 },
      { fileIndex: 1, photoIndex: 0 },
    ]);
  });

  it("duplikat numeru → tryb kolejności; nadmiarowe pliki bez przypisania", () => {
    const result = matchFilesToPhotos(["a-1.jpg", "b-1.jpg", "c-1.jpg"], 2);
    expect(result.mode).toBe("order");
    expect(result.assignments.filter((a) => a.photoIndex === null)).toHaveLength(1);
    expect(findDuplicateTargets(result.assignments)).toEqual([]);
  });

  it("sortowanie naturalne: 2 przed 10", () => {
    const result = matchFilesToPhotos(["img10.jpg", "img2.jpg"], 2);
    expect(result.assignments).toEqual([
      { fileIndex: 0, photoIndex: 1 },
      { fileIndex: 1, photoIndex: 0 },
    ]);
  });

  it("wykrywa wiele plików przypisanych do jednego zdjęcia", () => {
    expect(
      findDuplicateTargets([
        { fileIndex: 0, photoIndex: 0 },
        { fileIndex: 1, photoIndex: 0 },
        { fileIndex: 2, photoIndex: null },
      ]),
    ).toEqual([0]);
  });
});
