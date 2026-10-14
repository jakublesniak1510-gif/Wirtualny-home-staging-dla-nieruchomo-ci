"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { inputClass } from "./FormField";

export interface RevisionPhotoOption {
  id: string;
  number: number;
  name: string;
  thumb: string;
}

interface RevisionFormProps {
  token: string;
  photos: RevisionPhotoOption[];
  minLength: number;
  maxLength: number;
}

const HINTS = [
  "Inna sofa – jaśniejsza, mniej masywna",
  "Jaśniejsza podłoga",
  "Usuń roślinę",
  "Mniej dodatków na ścianach",
  "Inny dywan",
] as const;

/** Formularz bezpłatnej poprawki: wybór zdjęć, opis i podpowiedzi. */
export function RevisionForm({ token, photos, minLength, maxLength }: RevisionFormProps) {
  const router = useRouter();
  const ids = useId();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const length = message.trim().length;
  const messageId = `${ids}-opis`;
  const messageHelpId = `${ids}-opis-pomoc`;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addHint(hint: string) {
    setMessage((prev) => {
      const base = prev.trimEnd();
      const next = base ? `${base}${/[.!?]$/.test(base) ? "" : "."} ${hint}.` : `${hint}.`;
      return next.slice(0, maxLength);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (length < minLength) {
      setError(`Opisz poprawkę nieco dokładniej (min. ${minLength} znaków).`);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          photoIds: photos.length === 1 && photos[0] ? [photos[0].id] : selected,
          message,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.");
        setBusy(false);
        return;
      }
      setSent(true);
      setMessage("");
      setSelected([]);
      router.refresh();
    } catch {
      setError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="rounded-control border border-brand/30 bg-brand-light p-4" role="status" data-testid="revision-sent">
        <p className="font-semibold text-brand">Dziękujemy – zgłoszenie poprawki dotarło do nas.</p>
        <p className="mt-1 text-sm text-ink/80">
          Zwykle odpowiadamy w ciągu 24 h (w dni robocze). Gdy poprawione wizualizacje będą gotowe, wyślemy e-mail.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="revision-form">
      {photos.length > 1 && (
        <fieldset>
          <legend className="text-sm font-medium text-ink">Których zdjęć dotyczy poprawka?</legend>
          <p className="mt-1 text-xs text-muted">Nie zaznaczysz żadnego – uznamy, że dotyczy całego zamówienia.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => {
              const checked = selected.includes(photo.id);
              return (
                <label
                  key={photo.id}
                  className={`cursor-pointer rounded-control border-2 p-1.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                    checked ? "border-brand bg-brand-light" : "border-line bg-surface hover:border-brand/50"
                  }`}
                >
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-[8px] bg-cream">
                    <Image src={photo.thumb} alt="" fill unoptimized sizes="160px" className="object-cover" />
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 px-1 text-sm">
                    <input
                      type="checkbox"
                      name="zdjecia"
                      value={photo.id}
                      checked={checked}
                      onChange={() => toggle(photo.id)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="truncate">Zdjęcie {photo.number}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor={messageId} className="block text-sm font-medium text-ink">
          Co mamy zmienić?<span className="text-danger" aria-hidden="true"> *</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Przykładowe poprawki">
          {HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => addHint(hint)}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink hover:border-brand hover:bg-brand-light"
            >
              + {hint}
            </button>
          ))}
        </div>
        <textarea
          id={messageId}
          name="opis"
          rows={5}
          required
          minLength={minLength}
          maxLength={maxLength}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-describedby={messageHelpId}
          aria-invalid={error ? true : undefined}
          placeholder="Np. Zdjęcie 2: zamień sofę na jaśniejszą, usuń roślinę przy oknie. Podłoga bez zmian."
          className={`${inputClass} mt-2`}
        />
        <div id={messageHelpId} className="mt-1.5 flex justify-between gap-3 text-xs text-muted">
          <span>Im konkretniej, tym szybciej trafimy. Nie zmieniamy układu ani metrażu lokalu.</span>
          <span className={length > 0 && length < minLength ? "text-danger" : ""}>
            {length}/{maxLength}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
        {busy ? "Wysyłam…" : "Wyślij zgłoszenie poprawki"}
      </button>
    </form>
  );
}
