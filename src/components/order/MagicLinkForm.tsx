"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { FormField, inputClass } from "./FormField";

/** Formularz „wyślij mi link do moich zamówień” (bez hasła). */
export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (response.ok) setDone(body.message ?? "Sprawdź skrzynkę e-mail.");
      else setError(body.error ?? "Nie udało się wysłać linku. Spróbuj ponownie.");
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="rounded-control border border-brand/30 bg-brand-light p-4" role="status" data-testid="magic-link-sent">
        <p className="font-semibold text-brand">Sprawdź skrzynkę</p>
        <p className="mt-1 text-sm text-ink/80">{done}</p>
        <button type="button" className="link mt-3 text-sm" onClick={() => setDone(null)}>
          Wpisz inny adres
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormField id="moje-email" label="Adres e-mail z zamówienia" required error={error ?? undefined}>
        <input
          id="moje-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby="moje-email-opis"
          aria-invalid={error ? true : undefined}
          placeholder="np. jan@biuro.pl"
          className={inputClass}
        />
      </FormField>
      <button type="submit" className="btn-primary w-full" disabled={busy || email.trim().length === 0}>
        {busy ? "Wysyłam…" : "Wyślij link logowania"}
      </button>
    </form>
  );
}
