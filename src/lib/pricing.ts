/**
 * Cennik – jedyne źródło cen w serwisie. Wszystkie kwoty w groszach (int), brutto
 * (zawierają 23% VAT). Komponenty, API i e-maile MUSZĄ korzystać z tego modułu –
 * żadnych kwot wpisanych na sztywno.
 */

/** Waluta zamówień (format Stripe). */
export const CURRENCY = "pln";

/** Stawka VAT zawarta w cenach brutto. */
export const VAT_RATE = 0.23;

/** Minimalna i maksymalna liczba zdjęć w jednym zamówieniu. */
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 20;

/** Cena za zdjęcie przy zamówieniu poniżej progu hurtowego. */
export const PRICE_SINGLE = 3900;
/** Cena za zdjęcie od BULK_THRESHOLD zdjęć w zamówieniu (naliczana automatycznie). */
export const PRICE_BULK = 2900;
/** Od tylu zdjęć w zamówieniu obowiązuje PRICE_BULK. */
export const BULK_THRESHOLD = 10;

/** Dopłata za ekspres (realizacja w SITE.expressHours) – ułamek ceny bazowej całego zamówienia. */
export const EXPRESS_RATE = 0.5;

export const ADDONS = [
  {
    slug: "usuniecie-mebli",
    name: "Usunięcie starych mebli",
    description: "Cyfrowo usuwamy obecne meble i przedmioty, zanim wstawimy nowe.",
    pricePerPhoto: 1500,
  },
  {
    slug: "wirtualny-remont",
    name: "Wirtualny remont",
    description: "Odświeżamy podłogę i ściany – nowy kolor, panele, deski lub płytki.",
    pricePerPhoto: 2500,
  },
  {
    slug: "noc-dzien",
    name: "Noc → dzień",
    description: "Zdjęcie zrobione wieczorem lub w pochmurny dzień zamieniamy na jasne, dzienne.",
    pricePerPhoto: 1500,
  },
] as const;

export type Addon = (typeof ADDONS)[number];
export type AddonSlug = Addon["slug"];

export const ADDON_SLUGS: readonly AddonSlug[] = ADDONS.map((addon) => addon.slug);

/** Abonament dla biur nieruchomości (fakturowany ręcznie, obsługa przez formularz „Dla biur”). */
export const OFFICE_PLAN = {
  /** Cena miesięczna netto w groszach. */
  monthlyNet: 79900,
  /** Liczba zdjęć w miesiącu. */
  photosPerMonth: 40,
  /** Priorytetowy czas realizacji w godzinach. */
  priorityHours: 12,
  /** Dodatki (usunięcie mebli, remont, noc → dzień) wliczone w cenę. */
  addonsIncluded: true,
} as const;

/** Cena netto za zdjęcie w abonamencie (zaokrąglona do grosza). */
export const OFFICE_PLAN_NET_PER_PHOTO = Math.round(
  OFFICE_PLAN.monthlyNet / OFFICE_PLAN.photosPerMonth,
);
/** Orientacyjna cena netto za zdjęcie w abonamencie, zaokrąglona do pełnych złotych („ok. 20 zł”). */
export const OFFICE_PLAN_APPROX_NET_PER_PHOTO = Math.round(OFFICE_PLAN_NET_PER_PHOTO / 100) * 100;

/** Bezpłatne poprawki wliczone w cenę każdego zdjęcia. */
export const INCLUDED_REVISIONS = 1;
/** Ile dni od dostarczenia klient ma na zgłoszenie bezpłatnej poprawki. */
export const REVISION_WINDOW_DAYS = 7;

/** Darmowa próbka dla nowego agenta. */
export const FREE_SAMPLE_PHOTOS = 1;

/** Nagroda w programie poleceń: kod na tyle zdjęć gratis (realizacja ręczna przez admina). */
export const REFERRAL_REWARD_PHOTOS = 5;

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

export interface PriceInput {
  /** Liczba zdjęć w zamówieniu (MIN_PHOTOS–MAX_PHOTOS). */
  photoCount: number;
  /** Slugi dodatków – każdy naliczany za każde zdjęcie. Duplikaty są ignorowane. */
  addons?: readonly string[];
  /** Realizacja ekspresowa. */
  express?: boolean;
  /**
   * Dostępne kredyty z kodu pakietu (PackageCode.creditsLeft).
   * 1 kredyt = 1 zdjęcie bazowe; dodatki i ekspres są płatne osobno.
   */
  packageCredits?: number;
}

export interface PriceBreakdown {
  photoCount: number;
  /** Cena bazowa jednego zdjęcia w tym zamówieniu (PRICE_SINGLE lub PRICE_BULK). */
  unitPrice: number;
  /** Czy naliczono cenę hurtową. */
  bulkApplied: boolean;
  /** Cena bazowa: unitPrice × photoCount. */
  base: number;
  /** Wybrane dodatki (po deduplikacji, w kolejności z ADDONS). */
  addonSlugs: AddonSlug[];
  /** Suma cen dodatków za jedno zdjęcie. */
  addonsPerPhoto: number;
  /** Dodatki łącznie: addonsPerPhoto × photoCount. */
  addons: number;
  /** Dopłata za ekspres: EXPRESS_RATE × base (od pełnej ceny bazowej, przed kredytami). */
  express: number;
  /** Liczba wykorzystanych kredytów z kodu pakietu (≤ photoCount). */
  creditsUsed: number;
  /** Rabat z kredytów: creditsUsed × unitPrice. */
  discount: number;
  /** Suma przed rabatem: base + addons + express. */
  subtotal: number;
  /** Do zapłaty (brutto): subtotal − discount. */
  total: number;
  /** Średnio za zdjęcie (total / photoCount, zaokrąglone do grosza). */
  perPhoto: number;
  /** Kwota netto zawarta w total. */
  net: number;
  /** VAT zawarty w total. */
  vat: number;
  currency: typeof CURRENCY;
}

export function isAddonSlug(value: string): value is AddonSlug {
  return (ADDON_SLUGS as readonly string[]).includes(value);
}

export function getAddon(slug: AddonSlug): Addon {
  const addon = ADDONS.find((a) => a.slug === slug);
  if (!addon) throw new PricingError(`Nieznany dodatek: ${slug}`);
  return addon;
}

/** Cena bazowa jednego zdjęcia przy danej liczbie zdjęć w zamówieniu. */
export function getUnitPrice(photoCount: number): number {
  return photoCount >= BULK_THRESHOLD ? PRICE_BULK : PRICE_SINGLE;
}

/** Kwota netto z brutto (grosze, zaokrąglenie do grosza). */
export function grossToNet(gross: number): number {
  return Math.round(gross / (1 + VAT_RATE));
}

/** Kwota brutto z netto (grosze, zaokrąglenie do grosza). */
export function netToGross(net: number): number {
  return Math.round(net * (1 + VAT_RATE));
}

/**
 * Wylicza cenę zamówienia. Rzuca PricingError przy niepoprawnych danych
 * (liczba zdjęć spoza zakresu, nieznany dodatek, ujemne kredyty).
 */
export function calculateOrderPrice(input: PriceInput): PriceBreakdown {
  const { photoCount, express = false, packageCredits = 0 } = input;

  if (!Number.isInteger(photoCount) || photoCount < MIN_PHOTOS || photoCount > MAX_PHOTOS) {
    throw new PricingError(
      `Liczba zdjęć musi być liczbą całkowitą od ${MIN_PHOTOS} do ${MAX_PHOTOS}.`,
    );
  }
  if (!Number.isInteger(packageCredits) || packageCredits < 0) {
    throw new PricingError("Liczba kredytów musi być nieujemną liczbą całkowitą.");
  }

  const requested = new Set(input.addons ?? []);
  for (const slug of requested) {
    if (!isAddonSlug(slug)) throw new PricingError(`Nieznany dodatek: ${slug}`);
  }
  const selectedAddons = ADDONS.filter((addon) => requested.has(addon.slug));

  const unitPrice = getUnitPrice(photoCount);
  const base = unitPrice * photoCount;
  const addonsPerPhoto = selectedAddons.reduce((sum, addon) => sum + addon.pricePerPhoto, 0);
  const addons = addonsPerPhoto * photoCount;
  const expressAmount = express ? Math.round(base * EXPRESS_RATE) : 0;
  const creditsUsed = Math.min(packageCredits, photoCount);
  const discount = creditsUsed * unitPrice;
  const subtotal = base + addons + expressAmount;
  const total = subtotal - discount;
  const net = grossToNet(total);

  return {
    photoCount,
    unitPrice,
    bulkApplied: unitPrice === PRICE_BULK,
    base,
    addonSlugs: selectedAddons.map((addon) => addon.slug),
    addonsPerPhoto,
    addons,
    express: expressAmount,
    creditsUsed,
    discount,
    subtotal,
    total,
    perPhoto: Math.round(total / photoCount),
    net,
    vat: total - net,
    currency: CURRENCY,
  };
}
