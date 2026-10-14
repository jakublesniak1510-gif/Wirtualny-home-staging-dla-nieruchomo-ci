/**
 * Treści zgód wymaganych przy zamówieniu (kreator i darmowa próbka).
 * Klucze odpowiadają polom Order.consent*. Treść „honesty” – dosłownie wg briefu.
 */
export const CONSENT_KEYS = ["terms", "digital", "honesty", "rights"] as const;
export type ConsentKey = (typeof CONSENT_KEYS)[number];

export const CONSENT_TEXTS: Record<ConsentKey, string> = {
  terms: "Akceptuję Regulamin i Politykę prywatności.",
  digital:
    "Wyrażam zgodę na rozpoczęcie świadczenia usługi cyfrowej przed upływem 14 dni od zawarcia umowy i przyjmuję do wiadomości, że jako konsument tracę w ten sposób prawo odstąpienia od umowy.",
  honesty:
    "Rozumiem, że wizualizacja nie może ukrywać wad lokalu ani zmieniać jego metrażu; zobowiązuję się publikować również zdjęcie oryginalne lub wyraźnie oznaczać wizualizację.",
  rights:
    "Oświadczam, że mam prawa do przesłanych zdjęć (jestem ich autorem lub mam zgodę autora i właściciela lokalu) i mogę przekazać je do obróbki.",
};

/** Krótkie etykiety (panel admina). */
export const CONSENT_LABELS: Record<ConsentKey, string> = {
  terms: "Regulamin i polityka prywatności",
  digital: "Usługa cyfrowa – utrata prawa odstąpienia",
  honesty: "Uczciwość wizualizacji",
  rights: "Prawa do zdjęć",
};
