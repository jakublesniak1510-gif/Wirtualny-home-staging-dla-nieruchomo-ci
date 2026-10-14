/**
 * Orientacyjne dane rynkowe do kalkulatora oszczędności, porównania i bloga.
 * To NIE są nasze ceny (te są w src/lib/pricing.ts), tylko szacunki typowych kosztów alternatyw.
 * Kwoty w groszach (int), brutto. Przy zmianie – zaktualizuj też MARKET_SOURCE_NOTE.
 */

/** Opis źródła wyświetlany pod kalkulatorem i tabelą porównania. */
export const MARKET_SOURCE_NOTE =
  "Ceny rynkowe PL 2025–2026, orientacyjnie – na podstawie publicznych cenników i ofert firm home stagingowych; rzeczywisty koszt zależy od metrażu, miasta i zakresu.";

/** Fizyczny home staging całego mieszkania (wynajem/transport mebli, stylizacja, demontaż). */
export const PHYSICAL_STAGING_COST = { min: 300_000, max: 800_000 } as const;

/** Czas przygotowania fizycznego home stagingu (od zlecenia do sesji zdjęciowej), w dniach. */
export const PHYSICAL_STAGING_DAYS = { min: 3, max: 7 } as const;

/** Zagraniczne narzędzia AI „zrób to sam” – koszt jednego zdjęcia przy abonamencie (przeliczenie z USD/EUR). */
export const DIY_AI_COST_PER_PHOTO = { min: 500, max: 3_000 } as const;

/** Agencja graficzna / studio wizualizacji – ręczny wirtualny staging jednego zdjęcia. */
export const AGENCY_COST_PER_PHOTO = { min: 8_000, max: 30_000 } as const;

/** Czas realizacji w agencji graficznej, w dniach roboczych. */
export const AGENCY_DAYS = { min: 2, max: 5 } as const;
