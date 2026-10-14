/**
 * Logika kalkulatora oszczędności (czysta, bez Reacta – testowana w savings.test.ts).
 * Nasze ceny liczymy wyłącznie przez src/lib/pricing.ts, koszty alternatyw – z src/content/market.ts.
 */
import { PHYSICAL_STAGING_COST, PHYSICAL_STAGING_DAYS } from "@/content/market";
import { MAX_PHOTOS, MIN_PHOTOS, OFFICE_PLAN, calculateOrderPrice, grossToNet, netToGross } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export type BillingMode = "single" | "subscription";

/** Zakres suwaka „ofert miesięcznie”. */
export const MIN_LISTINGS = 1;
export const MAX_LISTINGS = 20;

export interface SavingsInput {
  /** Zdjęć na jedno ogłoszenie (MIN_PHOTOS–MAX_PHOTOS). */
  photosPerListing: number;
  /** Ogłoszeń (mieszkań) miesięcznie (MIN_LISTINGS–MAX_LISTINGS). */
  listingsPerMonth: number;
  mode: BillingMode;
}

export interface Range {
  min: number;
  max: number;
}

export interface SavingsResult {
  photosPerListing: number;
  listingsPerMonth: number;
  mode: BillingMode;
  /** Zdjęć miesięcznie łącznie. */
  photosPerMonth: number;
  /** Nasz koszt miesięcznie – brutto, grosze. */
  ourMonthly: number;
  /** Nasz koszt miesięcznie – netto, grosze. */
  ourMonthlyNet: number;
  /** Nasz koszt na jedno ogłoszenie – brutto, grosze. */
  ourPerListing: number;
  /** Liczba abonamentów potrzebna przy tej liczbie zdjęć (0 w trybie „pojedynczo”). */
  plansNeeded: number;
  /** Fizyczny home staging miesięcznie – brutto, grosze. */
  physicalMonthly: Range;
  /** Oszczędność miesięcznie (≥ 0) – grosze. */
  savings: Range;
  /** Oszczędność w procentach (0–100, zaokrąglona). */
  savingsPercent: Range;
  /** Nasz czas realizacji w godzinach. */
  ourHours: number;
  /** Czas przygotowania fizycznego stagingu w dniach. */
  physicalDays: Range;
}

/** Przycina wartość do zakresu i zaokrągla do liczby całkowitej (NaN → min). */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

/** Koszt miesięczny w danym trybie (brutto i netto, grosze) + liczba abonamentów. */
export function monthlyCost(photosPerListing: number, listingsPerMonth: number, mode: BillingMode) {
  const photos = clampInt(photosPerListing, MIN_PHOTOS, MAX_PHOTOS);
  const listings = clampInt(listingsPerMonth, MIN_LISTINGS, MAX_LISTINGS);
  if (mode === "subscription") {
    const plansNeeded = Math.ceil((photos * listings) / OFFICE_PLAN.photosPerMonth);
    const net = plansNeeded * OFFICE_PLAN.monthlyNet;
    return { gross: netToGross(net), net, plansNeeded };
  }
  // Każde ogłoszenie = osobne zamówienie (próg hurtowy liczony w ramach zamówienia).
  const gross = calculateOrderPrice({ photoCount: photos }).total * listings;
  return { gross, net: grossToNet(gross), plansNeeded: 0 };
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const photosPerListing = clampInt(input.photosPerListing, MIN_PHOTOS, MAX_PHOTOS);
  const listingsPerMonth = clampInt(input.listingsPerMonth, MIN_LISTINGS, MAX_LISTINGS);
  const mode: BillingMode = input.mode === "subscription" ? "subscription" : "single";
  const cost = monthlyCost(photosPerListing, listingsPerMonth, mode);

  const physicalMonthly = {
    min: PHYSICAL_STAGING_COST.min * listingsPerMonth,
    max: PHYSICAL_STAGING_COST.max * listingsPerMonth,
  };
  const savings = {
    min: Math.max(0, physicalMonthly.min - cost.gross),
    max: Math.max(0, physicalMonthly.max - cost.gross),
  };

  return {
    photosPerListing,
    listingsPerMonth,
    mode,
    photosPerMonth: photosPerListing * listingsPerMonth,
    ourMonthly: cost.gross,
    ourMonthlyNet: cost.net,
    ourPerListing: Math.round(cost.gross / listingsPerMonth),
    plansNeeded: cost.plansNeeded,
    physicalMonthly,
    savings,
    savingsPercent: {
      min: percentOf(savings.min, physicalMonthly.min),
      max: percentOf(savings.max, physicalMonthly.max),
    },
    ourHours: mode === "subscription" ? OFFICE_PLAN.priorityHours : SITE.turnaroundHours,
    physicalDays: { ...PHYSICAL_STAGING_DAYS },
  };
}

/** Który tryb wychodzi taniej przy danych parametrach (remis → „pojedynczo”). */
export function cheaperMode(photosPerListing: number, listingsPerMonth: number): BillingMode {
  const single = monthlyCost(photosPerListing, listingsPerMonth, "single").gross;
  const subscription = monthlyCost(photosPerListing, listingsPerMonth, "subscription").gross;
  return subscription < single ? "subscription" : "single";
}
