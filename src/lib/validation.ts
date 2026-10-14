import { z } from "zod";
import { ADDON_SLUGS, MAX_PHOTOS, MIN_PHOTOS, isAddonSlug } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { isStyleSlug } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

/** Schematy walidacji danych wejściowych API (zod). Komunikaty po polsku – trafiają do UI. */

/** Tekst opcjonalny: przycięty, pusty → undefined. */
function optionalText(max: number, label: string) {
  return z
    .string({ error: `${label}: nieprawidłowa wartość.` })
    .trim()
    .max(max, { error: `${label}: maksymalnie ${max} znaków.` })
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

export const emailSchema = z
  .string({ error: "Podaj adres e-mail." })
  .trim()
  .toLowerCase()
  .min(1, { error: "Podaj adres e-mail." })
  .max(254, { error: "Adres e-mail jest za długi." })
  .pipe(z.email({ error: "Podaj poprawny adres e-mail." }));

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

export const optionalPhoneSchema = optionalText(30, "Telefon").refine(
  (value) => value === undefined || (PHONE_RE.test(value) && value.replace(/\D/g, "").length >= 7),
  { error: "Podaj poprawny numer telefonu (np. +48 600 000 000)." },
);

export const requiredPhoneSchema = z
  .string({ error: "Podaj numer telefonu." })
  .trim()
  .min(1, { error: "Podaj numer telefonu." })
  .refine((value) => PHONE_RE.test(value) && value.replace(/\D/g, "").length >= 7, {
    error: "Podaj poprawny numer telefonu (np. +48 600 000 000).",
  });

/** Poprawność polskiego NIP (10 cyfr + suma kontrolna). Przyjmuje myślniki, spacje i prefiks PL. */
export function isValidNip(input: string): boolean {
  const digits = input.replace(/^PL/i, "").replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(digits)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, weight, index) => acc + weight * Number(digits[index]), 0);
  const control = sum % 11;
  return control !== 10 && control === Number(digits[9]);
}

export const optionalNipSchema = optionalText(20, "NIP")
  .refine((value) => value === undefined || isValidNip(value), {
    error: "Podaj poprawny NIP (10 cyfr).",
  })
  .transform((value) => (value ? value.replace(/^PL/i, "").replace(/[\s-]/g, "") : undefined));

/** Kod pakietu: wielkie litery, cyfry i myślniki, np. WS-ABCD-EFGH. */
export const packageCodeSchema = z
  .string({ error: "Podaj kod pakietu." })
  .trim()
  .toUpperCase()
  .min(4, { error: "Kod pakietu jest za krótki." })
  .max(40, { error: "Kod pakietu jest za długi." })
  .regex(/^[A-Z0-9-]+$/, { error: "Kod pakietu może zawierać tylko litery, cyfry i myślniki." });

export const optionalPackageCodeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(packageCodeSchema.optional());

/** Klucz pliku tymczasowego z /api/upload. */
export const TMP_KEY_RE = /^tmp\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export const tmpKeySchema = z
  .string()
  .regex(TMP_KEY_RE, { error: "Nieprawidłowy identyfikator wgranego pliku – wgraj zdjęcie ponownie." });

export const styleSchema = z.custom<StyleSlug>(
  (value) => typeof value === "string" && isStyleSlug(value),
  { error: "Wybierz styl aranżacji." },
);

export const addonSchema = z.custom<AddonSlug>(
  (value) => typeof value === "string" && isAddonSlug(value),
  { error: `Nieznany dodatek (dozwolone: ${ADDON_SLUGS.join(", ")}).` },
);

const photoSchema = z.object({
  tmpKey: tmpKeySchema,
  name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : "zdjecie")),
});

function consent(message: string) {
  return z.literal(true, { error: message });
}

export const consentsSchema = z.object(
  {
    terms: consent("Zaakceptuj Regulamin i Politykę prywatności."),
    digital: consent("Potwierdź zgodę na rozpoczęcie świadczenia usługi cyfrowej."),
    honesty: consent("Potwierdź zasady uczciwego oznaczania wizualizacji."),
    rights: consent("Potwierdź, że masz prawa do przesłanych zdjęć."),
  },
  { error: "Zaznacz wymagane zgody." },
);

export const orderInputSchema = z.object({
  photos: z
    .array(photoSchema, { error: "Dodaj zdjęcia do zamówienia." })
    .min(MIN_PHOTOS, { error: `Dodaj co najmniej ${MIN_PHOTOS} zdjęcie.` })
    .max(MAX_PHOTOS, { error: `Możesz dodać maksymalnie ${MAX_PHOTOS} zdjęć w jednym zamówieniu.` })
    .refine((photos) => new Set(photos.map((p) => p.tmpKey)).size === photos.length, {
      error: "To samo zdjęcie zostało dodane dwa razy.",
    }),
  style: styleSchema,
  addons: z
    .array(addonSchema)
    .max(ADDON_SLUGS.length)
    .default([])
    .transform((addons) => [...new Set(addons)]),
  express: z.boolean().default(false),
  notes: optionalText(1000, "Uwagi"),
  email: emailSchema,
  phone: optionalPhoneSchema,
  name: optionalText(120, "Imię i nazwisko"),
  company: optionalText(160, "Firma"),
  nip: optionalNipSchema,
  packageCode: optionalPackageCodeSchema,
  referralCode: optionalText(40, "Kod polecenia"),
  consents: consentsSchema,
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export const sampleInputSchema = z.object({
  photo: photoSchema,
  style: styleSchema,
  email: emailSchema,
  phone: requiredPhoneSchema,
  company: z
    .string({ error: "Podaj nazwę biura nieruchomości." })
    .trim()
    .min(2, { error: "Podaj nazwę biura nieruchomości." })
    .max(160, { error: "Nazwa biura: maksymalnie 160 znaków." }),
  name: optionalText(120, "Imię i nazwisko"),
  notes: optionalText(1000, "Uwagi"),
  consents: consentsSchema,
});

export type SampleInput = z.infer<typeof sampleInputSchema>;

export const codeValidateSchema = z.object({ code: packageCodeSchema });

export const packageCodeCreateSchema = z.object({
  credits: z.coerce
    .number({ error: "Podaj liczbę kredytów." })
    .int({ error: "Liczba kredytów musi być liczbą całkowitą." })
    .min(1, { error: "Minimalnie 1 kredyt." })
    .max(1000, { error: "Maksymalnie 1000 kredytów." }),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .pipe(emailSchema.optional()),
  note: optionalText(500, "Notatka"),
  /** Data ważności w formacie RRRR-MM-DD (włącznie z tym dniem). */
  expiresAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine((value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      error: "Data ważności w formacie RRRR-MM-DD.",
    })
    .transform((value) => (value ? new Date(`${value}T23:59:59.999Z`) : undefined))
    .refine((value) => value === undefined || !Number.isNaN(value.getTime()), {
      error: "Nieprawidłowa data ważności.",
    }),
});

export const ADMIN_SETTABLE_STATUSES = ["IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"] as const;

export const adminStatusSchema = z.object({
  status: z.enum(ADMIN_SETTABLE_STATUSES, { error: "Nieprawidłowy status." }),
});

export interface ValidationErrorBody {
  error: string;
  fields: Record<string, string>;
}

/** Czytelny błąd walidacji: pierwszy komunikat + mapa pole → komunikat. */
export function formatZodError(error: z.ZodError): ValidationErrorBody {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  const first = error.issues[0]?.message ?? "Nieprawidłowe dane.";
  return { error: first, fields };
}
