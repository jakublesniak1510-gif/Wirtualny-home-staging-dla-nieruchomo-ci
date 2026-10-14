import { describe, expect, it } from "vitest";
import {
  BULK_THRESHOLD,
  EXPRESS_RATE,
  MAX_PHOTOS,
  PRICE_BULK,
  PRICE_SINGLE,
  PricingError,
  calculateOrderPrice,
  getUnitPrice,
  grossToNet,
} from "./pricing";

describe("calculateOrderPrice", () => {
  it("1 zdjęcie kosztuje 39 zł", () => {
    const p = calculateOrderPrice({ photoCount: 1 });
    expect(p.unitPrice).toBe(3900);
    expect(p.base).toBe(3900);
    expect(p.addons).toBe(0);
    expect(p.express).toBe(0);
    expect(p.discount).toBe(0);
    expect(p.total).toBe(3900);
    expect(p.perPhoto).toBe(3900);
    expect(p.bulkApplied).toBe(false);
    expect(p.currency).toBe("pln");
  });

  it("9 zdjęć – jeszcze cena pojedyncza (351 zł)", () => {
    const p = calculateOrderPrice({ photoCount: 9 });
    expect(p.unitPrice).toBe(PRICE_SINGLE);
    expect(p.total).toBe(35100);
  });

  it("10 zdjęć – cena hurtowa 29 zł/szt (290 zł)", () => {
    const p = calculateOrderPrice({ photoCount: BULK_THRESHOLD });
    expect(p.unitPrice).toBe(PRICE_BULK);
    expect(p.bulkApplied).toBe(true);
    expect(p.total).toBe(29000);
    expect(p.perPhoto).toBe(2900);
  });

  it("20 zdjęć – 580 zł", () => {
    const p = calculateOrderPrice({ photoCount: 20 });
    expect(p.base).toBe(58000);
    expect(p.total).toBe(58000);
  });

  it("dodatki naliczane za każde zdjęcie", () => {
    const p = calculateOrderPrice({
      photoCount: 2,
      addons: ["usuniecie-mebli", "wirtualny-remont", "noc-dzien"],
    });
    expect(p.addonsPerPhoto).toBe(1500 + 2500 + 1500);
    expect(p.addons).toBe(2 * 5500);
    expect(p.total).toBe(2 * 3900 + 2 * 5500);
    expect(p.perPhoto).toBe(3900 + 5500);
  });

  it("duplikaty dodatków są ignorowane, kolejność wg cennika", () => {
    const p = calculateOrderPrice({
      photoCount: 1,
      addons: ["noc-dzien", "usuniecie-mebli", "noc-dzien"],
    });
    expect(p.addonSlugs).toEqual(["usuniecie-mebli", "noc-dzien"]);
    expect(p.addons).toBe(3000);
  });

  it("ekspres to +50% ceny bazowej całego zamówienia (bez dodatków)", () => {
    const p = calculateOrderPrice({ photoCount: 10, addons: ["noc-dzien"], express: true });
    expect(p.express).toBe(29000 * EXPRESS_RATE);
    expect(p.total).toBe(29000 + 15000 + 14500);
  });

  it("ekspres przy nieparzystej kwocie zaokrągla do grosza", () => {
    const p = calculateOrderPrice({ photoCount: 1, express: true });
    expect(p.express).toBe(1950);
    expect(p.total).toBe(5850);
  });

  it("kredyty częściowe – pokrywają część zdjęć bazowych", () => {
    const p = calculateOrderPrice({ photoCount: 12, packageCredits: 5 });
    expect(p.creditsUsed).toBe(5);
    expect(p.discount).toBe(5 * PRICE_BULK);
    expect(p.total).toBe(7 * PRICE_BULK);
  });

  it("kredyty pełne – zdjęcia bazowe za 0 zł, dodatki i ekspres płatne", () => {
    const p = calculateOrderPrice({
      photoCount: 3,
      packageCredits: 40,
      addons: ["wirtualny-remont"],
      express: true,
    });
    expect(p.creditsUsed).toBe(3);
    expect(p.discount).toBe(p.base);
    expect(p.total).toBe(3 * 2500 + Math.round(3 * 3900 * EXPRESS_RATE));
  });

  it("kredyty pełne bez dodatków – zamówienie za 0 zł", () => {
    const p = calculateOrderPrice({ photoCount: 4, packageCredits: 4 });
    expect(p.total).toBe(0);
    expect(p.perPhoto).toBe(0);
    expect(p.vat).toBe(0);
  });

  it("netto + VAT = brutto", () => {
    const p = calculateOrderPrice({ photoCount: 10 });
    expect(p.net).toBe(grossToNet(29000));
    expect(p.net + p.vat).toBe(p.total);
    expect(p.net).toBe(23577);
  });

  it("0 zdjęć → błąd", () => {
    expect(() => calculateOrderPrice({ photoCount: 0 })).toThrow(PricingError);
  });

  it("za dużo zdjęć, ułamek, ujemne kredyty, nieznany dodatek → błąd", () => {
    expect(() => calculateOrderPrice({ photoCount: MAX_PHOTOS + 1 })).toThrow(PricingError);
    expect(() => calculateOrderPrice({ photoCount: 2.5 })).toThrow(PricingError);
    expect(() => calculateOrderPrice({ photoCount: 2, packageCredits: -1 })).toThrow(
      PricingError,
    );
    expect(() => calculateOrderPrice({ photoCount: 2, addons: ["hakowanie"] })).toThrow(
      PricingError,
    );
  });
});

describe("getUnitPrice", () => {
  it("próg hurtowy od 10 zdjęć", () => {
    expect(getUnitPrice(BULK_THRESHOLD - 1)).toBe(PRICE_SINGLE);
    expect(getUnitPrice(BULK_THRESHOLD)).toBe(PRICE_BULK);
  });
});
