"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CONTACT_CONSENT_TEXT, PROVIDER } from "@/content/legal";
import { OFFICE_LISTINGS_OPTIONS } from "@/content/service";
import { CONTACT_LIMITS } from "@/lib/contact-shared";
import type { ContactApiResponse, ContactType } from "@/lib/contact-shared";
import { ROUTES } from "@/lib/site";

interface ContactFormProps {
  /** contact – /kontakt; office – zapytanie o abonament na /dla-biur. */
  type: ContactType;
  /** Tekst przycisku wysyłki. */
  submitLabel?: string;
  className?: string;
}

type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "mt-1.5 block w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink shadow-sm placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 aria-[invalid=true]:border-danger";

function Field({
  id,
  label,
  optional = false,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {optional ? <span className="font-normal text-muted"> (opcjonalnie)</span> : <span aria-hidden="true" className="text-danger"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Formularz kontaktowy / zapytanie dla biur → POST /api/contact. */
export function ContactForm({ type, submitLabel, className = "" }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const isOffice = type === "office";

  const describedBy = (name: string, hasHint = false) => {
    if (fieldErrors[name]) return `${fid(name)}-error`;
    return hasHint ? `${fid(name)}-hint` : undefined;
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();

    const payload: Record<string, string | boolean> = {
      type,
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      message: text("message"),
      consent: data.get("consent") === "on",
      website: text("website"),
    };
    if (isOffice) {
      payload.company = text("company");
      payload.listingsPerMonth = text("listingsPerMonth");
    }

    setStatus("sending");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as ContactApiResponse | null;

      if (response.ok && result?.ok) {
        setStatus("success");
        form.reset();
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }

      setStatus("error");
      if (result && !result.ok) {
        setErrorMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        const firstField = result.fieldErrors ? Object.keys(result.fieldErrors)[0] : undefined;
        if (firstField) {
          requestAnimationFrame(() => {
            const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`);
            el?.focus();
          });
          return;
        }
      } else {
        setErrorMessage("Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.");
      }
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      setStatus("error");
      setErrorMessage("Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.");
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }

  if (status === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className={`card border-brand/40 bg-brand-light p-6 sm:p-8 ${className}`}
      >
        <p className="text-lg font-semibold text-brand">Dziękujemy – wiadomość dotarła!</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {isOffice
            ? "Przygotujemy ofertę dopasowaną do liczby Waszych ogłoszeń i odezwiemy się w ciągu jednego dnia roboczego."
            : "Odpowiemy najszybciej, jak to możliwe – w dni robocze zwykle w ciągu kilku godzin."}
        </p>
        <button type="button" className="btn-secondary mt-6" onClick={() => setStatus("idle")}>
          Wyślij kolejną wiadomość
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      aria-describedby={status === "error" ? `${uid}-status` : undefined}
      className={`card relative space-y-5 p-6 sm:p-8 ${className}`}
    >
      {status === "error" && errorMessage && (
        <div
          id={`${uid}-status`}
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {errorMessage}
        </div>
      )}

      {isOffice && (
        <Field id={fid("company")} label="Nazwa biura lub firmy" error={fieldErrors.company}>
          <input
            id={fid("company")}
            name="company"
            type="text"
            required
            minLength={2}
            maxLength={CONTACT_LIMITS.companyMax}
            autoComplete="organization"
            aria-invalid={Boolean(fieldErrors.company)}
            aria-describedby={describedBy("company")}
            className={inputClass}
          />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={fid("name")} label="Imię" error={fieldErrors.name}>
          <input
            id={fid("name")}
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={CONTACT_LIMITS.nameMax}
            autoComplete="given-name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={describedBy("name")}
            className={inputClass}
          />
        </Field>
        <Field id={fid("phone")} label="Telefon" optional error={fieldErrors.phone}>
          <input
            id={fid("phone")}
            name="phone"
            type="tel"
            maxLength={CONTACT_LIMITS.phoneMax}
            autoComplete="tel"
            inputMode="tel"
            placeholder="np. 600 000 000"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={describedBy("phone")}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id={fid("email")} label="E-mail" error={fieldErrors.email}>
        <input
          id={fid("email")}
          name="email"
          type="email"
          required
          maxLength={CONTACT_LIMITS.emailMax}
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={describedBy("email")}
          className={inputClass}
        />
      </Field>

      {isOffice && (
        <Field
          id={fid("listingsPerMonth")}
          label="Ile ofert publikujecie miesięcznie?"
          error={fieldErrors.listingsPerMonth}
        >
          <select
            id={fid("listingsPerMonth")}
            name="listingsPerMonth"
            required
            defaultValue=""
            aria-invalid={Boolean(fieldErrors.listingsPerMonth)}
            aria-describedby={describedBy("listingsPerMonth")}
            className={inputClass}
          >
            <option value="" disabled>
              Wybierz…
            </option>
            {OFFICE_LISTINGS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        id={fid("message")}
        label="Wiadomość"
        optional={isOffice}
        error={fieldErrors.message}
        hint={
          isOffice
            ? "Np. ilu agentów pracuje w biurze, jakie nieruchomości sprzedajecie, od kiedy chcecie zacząć."
            : "Jeśli pytasz o złożone zamówienie, wklej link do jego statusu z e-maila."
        }
      >
        <textarea
          id={fid("message")}
          name="message"
          rows={5}
          required={!isOffice}
          minLength={isOffice ? undefined : CONTACT_LIMITS.messageMin}
          maxLength={CONTACT_LIMITS.messageMax}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={describedBy("message", true)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {/* Honeypot – niewidoczne dla ludzi i czytników ekranu; wypełniają je tylko boty. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor={fid("website")}>Strona internetowa (zostaw puste)</label>
        <input id={fid("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id={fid("consent")}
            name="consent"
            type="checkbox"
            required
            aria-invalid={Boolean(fieldErrors.consent)}
            aria-describedby={fieldErrors.consent ? `${fid("consent")}-error` : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-brand"
          />
          <label htmlFor={fid("consent")} className="text-sm leading-relaxed text-ink">
            {CONTACT_CONSENT_TEXT}{" "}
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          </label>
        </div>
        {fieldErrors.consent && (
          <p id={`${fid("consent")}-error`} className="mt-1 pl-8 text-sm text-danger">
            {fieldErrors.consent}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="btn-primary px-6" disabled={status === "sending"} aria-busy={status === "sending"}>
          {status === "sending" ? "Wysyłanie…" : (submitLabel ?? (isOffice ? "Wyślij zapytanie" : "Wyślij wiadomość"))}
        </button>
        <p className="text-xs text-muted">
          <span aria-hidden="true" className="text-danger">*</span> pola wymagane
        </p>
      </div>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Administratorem danych jest {PROVIDER.legalName}. Dane z formularza wykorzystamy wyłącznie, aby
        odpowiedzieć na Twoją wiadomość{isOffice ? " i przygotować ofertę" : ""} (art. 6 ust. 1 lit. b i f RODO).
        Nie wysyłamy newslettera ani reklam bez Twojej osobnej zgody. Masz prawo dostępu do danych, ich
        sprostowania, usunięcia i wniesienia sprzeciwu. Szczegóły:{" "}
        <Link href={ROUTES.privacy} className="link">
          polityka prywatności
        </Link>
        .
      </p>
    </form>
  );
}
