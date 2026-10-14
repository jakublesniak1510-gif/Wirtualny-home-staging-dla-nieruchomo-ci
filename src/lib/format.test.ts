import { describe, expect, it } from "vitest";
import { formatPLN, formatPLNShort, formatPhotoCount, pluralizePL } from "./format";

const S = " ";

describe("formatPLN", () => {
  it("formatuje grosze jako złote", () => {
    expect(formatPLN(3900)).toBe(`39,00${S}zł`);
    expect(formatPLN(1950)).toBe(`19,50${S}zł`);
    expect(formatPLN(5)).toBe(`0,05${S}zł`);
    expect(formatPLN(0)).toBe(`0,00${S}zł`);
  });

  it("grupuje tysiące twardą spacją", () => {
    expect(formatPLN(129000)).toBe(`1${S}290,00${S}zł`);
  });

  it("wersja skrócona", () => {
    expect(formatPLNShort(2900)).toBe(`29${S}zł`);
    expect(formatPLNShort(1950)).toBe(`19,50${S}zł`);
  });
});

describe("pluralizePL", () => {
  it("odmienia „zdjęcie”", () => {
    expect(formatPhotoCount(1)).toBe(`1${S}zdjęcie`);
    expect(formatPhotoCount(3)).toBe(`3${S}zdjęcia`);
    expect(formatPhotoCount(5)).toBe(`5${S}zdjęć`);
    expect(formatPhotoCount(12)).toBe(`12${S}zdjęć`);
    expect(formatPhotoCount(22)).toBe(`22${S}zdjęcia`);
    expect(pluralizePL(0, ["a", "b", "c"])).toBe("c");
  });
});
