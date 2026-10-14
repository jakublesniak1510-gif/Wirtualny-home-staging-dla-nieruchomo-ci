"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ConsentFields, EMPTY_CONSENTS } from "@/components/order/ConsentFields";
import type { ConsentState } from "@/components/order/ConsentFields";
import { FormField, inputClass } from "@/components/order/FormField";
import { PhotoDropzone } from "@/components/order/PhotoDropzone";
import { StylePicker } from "@/components/order/StylePicker";
import { usePhotoUploads } from "@/components/order/usePhotoUploads";
import type { ConsentKey } from "@/lib/consents";
import { DEFAULT_STYLE } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

interface ApiError {
  error?: string;
  fields?: Record<string, string>;
}

/** Uproszczony kreator darmowej próbki (1 zdjęcie). */
export function FreeSampleForm({ maxMb, minShortSide }: { maxMb: number; minShortSide: number }) {
  const router = useRouter();
  const uploads = usePhotoUploads({ maxFiles: 1, maxMb });
  const [style, setStyle] = useState<StyleSlug>(DEFAULT_STYLE);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [consents, setConsents] = useState<ConsentState>(EMPTY_CONSENTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: Record<string, string> = {};
    const photo = uploads.done[0];
    if (!photo) local.photo = uploads.pending ? "Poczekaj, aż zdjęcie się wgra." : "Dodaj zdjęcie.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) local.email = "Podaj poprawny adres e-mail.";
    if (phone.trim().length < 7) local.phone = "Podaj numer telefonu.";
    if (company.trim().length < 2) local.company = "Podaj nazwę biura nieruchomości.";
    for (const key of Object.keys(consents) as ConsentKey[]) {
      if (!consents[key]) local[`consents.${key}`] = "Ta zgoda jest wymagana.";
    }
    setErrors(local);
    if (Object.keys(local).length > 0 || !photo) {
      setFormError(Object.values(local)[0] ?? null);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/free-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo: { tmpKey: photo.tmpKey, name: photo.name },
          style,
          email,
          phone,
          company,
          name,
          notes,
          consents,
        }),
      });
      const body = (await response.json()) as ApiError & { url?: string };
      if (!response.ok || !body.url) {
        setErrors(body.fields ?? {});
        setFormError(body.error ?? "Nie udało się wysłać zgłoszenia.");
        setSubmitting(false);
        return;
      }
      router.push(body.url);
    } catch {
      setFormError("Błąd połączenia. Spróbuj ponownie.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-7 p-5 sm:p-7">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">1. Zdjęcie pustego pomieszczenia</h2>
        <PhotoDropzone
          uploads={uploads}
          maxFiles={1}
          maxMb={maxMb}
          minShortSide={minShortSide}
          error={errors.photo ?? errors["photo.tmpKey"]}
        />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">2. Styl</h2>
        <StylePicker value={style} onChange={setStyle} compact />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">3. Dane kontaktowe</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="p-email" label="E-mail" required error={errors.email}>
            <input id="p-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby="p-email-opis" className={inputClass} />
          </FormField>
          <FormField id="p-telefon" label="Telefon" required error={errors.phone}>
            <input id="p-telefon" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby="p-telefon-opis" className={inputClass} />
          </FormField>
          <FormField id="p-biuro" label="Nazwa biura nieruchomości" required error={errors.company}>
            <input id="p-biuro" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} aria-invalid={Boolean(errors.company)} aria-describedby="p-biuro-opis" className={inputClass} />
          </FormField>
          <FormField id="p-imie" label="Imię i nazwisko" error={errors.name}>
            <input id="p-imie" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-describedby="p-imie-opis" className={inputClass} />
          </FormField>
          <FormField id="p-uwagi" label="Uwagi dla operatora" error={errors.notes} className="sm:col-span-2">
            <textarea id="p-uwagi" rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} aria-describedby="p-uwagi-opis" className={inputClass} />
          </FormField>
        </div>
      </div>
      <ConsentFields
        value={consents}
        onChange={setConsents}
        errors={{
          terms: errors["consents.terms"],
          digital: errors["consents.digital"],
          honesty: errors["consents.honesty"],
          rights: errors["consents.rights"],
        }}
      />
      {formError && (
        <p className="rounded-control bg-danger/10 px-3 py-2 text-sm font-medium text-danger" role="alert">
          {formError}
        </p>
      )}
      <button type="submit" className="btn-primary w-full text-base sm:w-auto" disabled={submitting || uploads.pending}>
        {submitting ? "Wysyłanie…" : "Odbierz darmową wizualizację"}
      </button>
    </form>
  );
}
