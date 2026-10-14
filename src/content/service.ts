/**
 * Parametry usługi opisywane na stronach informacyjnych (/jak-to-dziala, /cennik, /dla-biur, /kontakt).
 * Ceny i limity zamówień są w src/lib/pricing.ts – tu tylko to, czego tam nie ma.
 */

/** Ile wariantów aranżacji generujemy dla każdego zdjęcia, zanim wybierzemy najlepszy. */
export const VARIANTS_PER_PHOTO = { min: 2, max: 4 } as const;

/**
 * Maksymalny rozmiar jednego pliku (MB) – tylko do wyświetlenia w treściach.
 * Faktyczny limit egzekwuje upload (zmienna środowiskowa MAX_UPLOAD_MB).
 */
export const MAX_UPLOAD_MB_TEXT = Number(process.env.MAX_UPLOAD_MB ?? 25) || 25;

/**
 * Minimalny krótszy bok zdjęcia (px) – musi być zgodny z MIN_SHORT_SIDE w src/lib/images.ts
 * (tam jest egzekwowany przy uploadzie) – oraz zalecany dłuższy bok.
 */
export const MIN_PHOTO_SHORT_SIDE_PX = 800;
export const RECOMMENDED_PHOTO_LONG_SIDE_PX = 2000;

/** Akceptowane formaty plików (do wyświetlenia). */
export const ACCEPTED_FORMATS_TEXT = "JPG, PNG lub WebP";

/** Rabat dla fotografów nieruchomości w programie partnerskim (ułamek). */
export const PARTNER_DISCOUNT_RATE = 0.3;

/** Godziny, w których odpowiadamy na wiadomości (tekst do wyświetlenia). */
export const SUPPORT_HOURS = {
  days: "poniedziałek–piątek",
  hours: "9:00–17:00",
  /** Typowy czas odpowiedzi w dni robocze. */
  typicalResponse: "zwykle w ciągu kilku godzin",
  /** Najpóźniej. */
  maxResponse: "najpóźniej następnego dnia roboczego",
} as const;

/** Przedziały liczby ofert miesięcznie w formularzu „Dla biur”. */
export const OFFICE_LISTINGS_OPTIONS = [
  { value: "do-5", label: "do 5 ofert" },
  { value: "6-15", label: "6–15 ofert" },
  { value: "16-40", label: "16–40 ofert" },
  { value: "ponad-40", label: "ponad 40 ofert" },
] as const;

export type OfficeListingsValue = (typeof OFFICE_LISTINGS_OPTIONS)[number]["value"];

export const OFFICE_LISTINGS_VALUES = OFFICE_LISTINGS_OPTIONS.map((option) => option.value) as [
  OfficeListingsValue,
  ...OfficeListingsValue[],
];
