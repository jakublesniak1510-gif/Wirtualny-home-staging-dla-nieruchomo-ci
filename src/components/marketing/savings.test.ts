import { describe, expect, it } from "vitest";
import { PHYSICAL_STAGING_COST, PHYSICAL_STAGING_DAYS } from "@/content/market";
import { OFFICE_PLAN, PRICE_BULK, PRICE_SINGLE, calculateOrderPrice, netToGross } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { buildOrderHref } from "./order-link";
import { MAX_LISTINGS, calculateSavings, cheaperMode, clampInt, monthlyCost } from "./savings";

describe("clampInt", () => {
  it("przycina i zaokrągla", () => {
    expect(clampInt(0, 1, 20)).toBe(1);
    expect(clampInt(25, 1, 20)).toBe(20);
    expect(clampInt(4.6, 1, 20)).toBe(5);
    expect(clampInt(Number.NaN, 1, 20)).toBe(1);
  });
});

describe("calculateSavings – pojedynczo", () => {
  it("1 ogłoszenie × 5 zdjęć: nasz koszt z calculateOrderPrice", () => {
    const result = calculateSavings({ photosPerListing: 5, listingsPerMonth: 1, mode: "single" });
    expect(result.ourMonthly).toBe(5 * PRICE_SINGLE);
    expect(result.ourMonthly).toBe(calculateOrderPrice({ photoCount: 5 }).total);
    expect(result.physicalMonthly).toEqual(PHYSICAL_STAGING_COST);
    expect(result.savings.min).toBe(PHYSICAL_STAGING_COST.min - 5 * PRICE_SINGLE);
    expect(result.savings.max).toBe(PHYSICAL_STAGING_COST.max - 5 * PRICE_SINGLE);
    expect(result.ourHours).toBe(SITE.turnaroundHours);
    expect(result.physicalDays).toEqual(PHYSICAL_STAGING_DAYS);
    expect(result.plansNeeded).toBe(0);
  });

  it("próg hurtowy liczy się w ramach jednego ogłoszenia (zamówienia)", () => {
    const result = calculateSavings({ photosPerListing: 10, listingsPerMonth: 3, mode: "single" });
    expect(result.ourMonthly).toBe(3 * 10 * PRICE_BULK);
    expect(result.ourPerListing).toBe(10 * PRICE_BULK);
    expect(result.photosPerMonth).toBe(30);
  });

  it("procent oszczędności w zakresie 0–100", () => {
    const result = calculateSavings({ photosPerListing: 1, listingsPerMonth: 1, mode: "single" });
    expect(result.savingsPercent.min).toBe(Math.round(((PHYSICAL_STAGING_COST.min - PRICE_SINGLE) / PHYSICAL_STAGING_COST.min) * 100));
    expect(result.savingsPercent.max).toBeLessThanOrEqual(100);
    expect(result.savingsPercent.min).toBeGreaterThan(0);
  });

  it("niepoprawne dane są przycinane do zakresów", () => {
    const result = calculateSavings({ photosPerListing: 99, listingsPerMonth: 0, mode: "single" });
    expect(result.photosPerListing).toBe(20);
    expect(result.listingsPerMonth).toBe(1);
  });
});

describe("calculateSavings – abonament", () => {
  it("do 40 zdjęć miesięcznie wystarcza jeden abonament", () => {
    const result = calculateSavings({ photosPerListing: 8, listingsPerMonth: 5, mode: "subscription" });
    expect(result.plansNeeded).toBe(1);
    expect(result.ourMonthlyNet).toBe(OFFICE_PLAN.monthlyNet);
    expect(result.ourMonthly).toBe(netToGross(OFFICE_PLAN.monthlyNet));
    expect(result.ourHours).toBe(OFFICE_PLAN.priorityHours);
  });

  it("powyżej limitu liczy wielokrotność abonamentu", () => {
    const result = calculateSavings({ photosPerListing: 10, listingsPerMonth: 5, mode: "subscription" });
    expect(result.plansNeeded).toBe(Math.ceil(50 / OFFICE_PLAN.photosPerMonth));
  });

  it("oszczędność nigdy nie jest ujemna", () => {
    const result = calculateSavings({ photosPerListing: 20, listingsPerMonth: MAX_LISTINGS, mode: "subscription" });
    expect(result.savings.min).toBeGreaterThanOrEqual(0);
  });
});

describe("cheaperMode", () => {
  it("przy jednym zdjęciu taniej pojedynczo, przy wielu ofertach – abonament", () => {
    expect(cheaperMode(1, 1)).toBe("single");
    expect(cheaperMode(8, 5)).toBe("subscription");
  });

  it("zgadza się z monthlyCost", () => {
    const single = monthlyCost(4, 4, "single").gross;
    const sub = monthlyCost(4, 4, "subscription").gross;
    expect(cheaperMode(4, 4)).toBe(sub < single ? "subscription" : "single");
  });
});

describe("buildOrderHref", () => {
  it("bez parametrów – sam kreator", () => {
    expect(buildOrderHref({})).toBe("/zamow");
  });

  it("przenosi styl, liczbę zdjęć, dodatki (w kolejności cennika) i ekspres", () => {
    expect(
      buildOrderHref({
        style: "loft",
        photoCount: 6,
        addons: ["noc-dzien", "usuniecie-mebli", "noc-dzien"],
        express: true,
      }),
    ).toBe("/zamow?styl=loft&zdjecia=6&dodatki=usuniecie-mebli,noc-dzien&ekspres=1");
  });

  it("przycina liczbę zdjęć do zakresu", () => {
    expect(buildOrderHref({ photoCount: 50 })).toBe("/zamow?zdjecia=20");
  });
});
