/**
 * Wspólne dla formularza (klient) i API /api/contact – bez zależności od zod,
 * żeby nie powiększać paczki JS po stronie przeglądarki.
 */

/** Typy zgłoszeń zapisywanych w ContactRequest.type. */
export const CONTACT_TYPES = ["contact", "office"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_LIMITS = {
  nameMax: 100,
  companyMax: 160,
  emailMax: 200,
  phoneMax: 30,
  messageMin: 10,
  messageMax: 5000,
} as const;

/** Odpowiedź API /api/contact. */
export type ContactApiResponse =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
