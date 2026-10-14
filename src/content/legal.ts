/**
 * Stałe prawne wspólne dla regulaminu, polityki prywatności, FAQ i formularzy.
 * Zmiana terminu (np. retencji plików) = zmiana tutaj; dokumenty i FAQ zaktualizują się same.
 * Po każdej zmianie treści regulaminu/polityki zaktualizuj odpowiednią datę wersji.
 */
import { SITE } from "@/lib/site";

/** Data, od której obowiązuje bieżąca wersja regulaminu (RRRR-MM-DD). */
export const TERMS_EFFECTIVE_DATE = "2026-11-01";

/** Data ostatniej aktualizacji polityki prywatności (RRRR-MM-DD). */
export const PRIVACY_EFFECTIVE_DATE = "2026-11-01";

/** Po ilu dniach od realizacji zamówienia usuwamy zdjęcia klienta i wizualizacje. */
export const FILE_RETENTION_DAYS = 30;

/** W ilu dniach odpowiadamy na reklamację. */
export const COMPLAINT_RESPONSE_DAYS = 14;

/** Ustawowy termin na odstąpienie od umowy zawartej na odległość (konsument). */
export const WITHDRAWAL_DAYS = 14;

/** Ile lat przechowujemy dane rozliczeniowe (faktury, ewidencja – przepisy podatkowe). */
export const BILLING_RETENTION_YEARS = 5;

/** Ile lat przechowujemy korespondencję z formularza kontaktowego (okres przedawnienia roszczeń – orientacyjnie). */
export const CONTACT_RETENTION_YEARS = 3;

/** Treść zgody pod formularzami kontaktowymi (zapisywana razem ze zgłoszeniem). */
export const CONTACT_CONSENT_TEXT =
  "Zapoznałem(-am) się z polityką prywatności i zgadzam się na przetwarzanie podanych danych w celu odpowiedzi na moje zapytanie.";

/** true, gdy pole jest puste albo jest placeholderem w nawiasach kwadratowych, np. „[NIP]”. */
export function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || /^\[.*\]$/.test(trimmed);
}

/** Wartość pola firmy albo placeholder w nawiasach kwadratowych, gdy pole jest puste. */
export function companyField(value: string, placeholder: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : placeholder;
}

/** Dane usługodawcy do dokumentów prawnych (z SITE.company, placeholdery gdy puste). */
export const PROVIDER = {
  legalName: companyField(SITE.company.legalName, "[NAZWA FIRMY]"),
  nip: companyField(SITE.company.nip, "[NIP]"),
  address: companyField(SITE.company.address, "[ADRES]"),
  email: SITE.email,
  phone: SITE.phone,
  website: SITE.domain,
} as const;

/** Linki zewnętrzne używane w dokumentach. */
export const LEGAL_LINKS = {
  /** Rejestr podmiotów pozasądowego rozwiązywania sporów konsumenckich (UOKiK). */
  uokikDisputes: "https://polubowne.uokik.gov.pl",
  uokik: "https://uokik.gov.pl",
  /** Europejskie Centrum Konsumenckie w Polsce – spory transgraniczne w UE. */
  eck: "https://konsument.gov.pl",
  puodo: "https://uodo.gov.pl",
  stripePrivacy: "https://stripe.com/pl/privacy",
} as const;
