import { z } from "zod";
import { OFFICE_LISTINGS_VALUES } from "@/content/service";
import { CONTACT_LIMITS } from "@/lib/contact-shared";

const PHONE_PATTERN = /^[+()\d\s-]{6,30}$/;

const name = z
  .string({ error: "Podaj imię." })
  .trim()
  .min(2, { error: "Imię musi mieć co najmniej 2 znaki." })
  .max(CONTACT_LIMITS.nameMax, { error: "Imię jest za długie." });

const email = z
  .string({ error: "Podaj adres e-mail." })
  .trim()
  .toLowerCase()
  .max(CONTACT_LIMITS.emailMax, { error: "Adres e-mail jest za długi." })
  .pipe(z.email({ error: "Podaj poprawny adres e-mail." }));

/** Telefon opcjonalny: pusty string → undefined. */
const phone = z
  .string()
  .trim()
  .max(CONTACT_LIMITS.phoneMax, { error: "Numer telefonu jest za długi." })
  .refine((value) => value === "" || PHONE_PATTERN.test(value), {
    error: "Podaj poprawny numer telefonu (cyfry, spacje, „+”).",
  })
  .optional()
  .transform((value) => (value ? value : undefined));

const consent = z.literal(true, { error: "Zaznacz zgodę na przetwarzanie danych." });

/** Honeypot – ukryte pole, które wypełniają tylko boty. */
const website = z.string().max(500).optional();

export const contactRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("contact"),
    name,
    email,
    phone,
    message: z
      .string({ error: "Napisz wiadomość." })
      .trim()
      .min(CONTACT_LIMITS.messageMin, {
        error: `Wiadomość musi mieć co najmniej ${CONTACT_LIMITS.messageMin} znaków.`,
      })
      .max(CONTACT_LIMITS.messageMax, { error: "Wiadomość jest za długa." }),
    consent,
    website,
  }),
  z.object({
    type: z.literal("office"),
    company: z
      .string({ error: "Podaj nazwę biura lub firmy." })
      .trim()
      .min(2, { error: "Podaj nazwę biura lub firmy." })
      .max(CONTACT_LIMITS.companyMax, { error: "Nazwa firmy jest za długa." }),
    name,
    email,
    phone,
    listingsPerMonth: z.enum(OFFICE_LISTINGS_VALUES, { error: "Wybierz liczbę ofert miesięcznie." }),
    message: z
      .string()
      .trim()
      .max(CONTACT_LIMITS.messageMax, { error: "Wiadomość jest za długa." })
      .optional()
      .transform((value) => (value ? value : undefined)),
    consent,
    website,
  }),
]);

export type ContactRequestInput = z.input<typeof contactRequestSchema>;
export type ContactRequestData = z.output<typeof contactRequestSchema>;
