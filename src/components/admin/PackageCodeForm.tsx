"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { inputClass } from "@/components/order/FormField";

/** Tworzenie kodu pakietu (prepaid). */
export function PackageCodeForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const response = await fetch("/api/admin/package-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits: Number(data.get("credits")),
          email: data.get("email"),
          note: data.get("note"),
          expiresAt: data.get("expiresAt"),
        }),
      });
      const body = (await response.json()) as { error?: string; code?: { code: string } };
      if (!response.ok || !body.code) {
        setError(body.error ?? "Nie udało się utworzyć kodu.");
      } else {
        setCreated(body.code.code);
        form.reset();
        router.refresh();
      }
    } catch {
      setError("Błąd połączenia.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h2 className="text-base font-semibold text-ink">Nowy kod pakietu</h2>
      <label className="block text-sm">
        <span className="font-medium text-ink">Liczba kredytów (zdjęć)</span>
        <input name="credits" type="number" min={1} max={1000} defaultValue={10} required className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">E-mail klienta</span> <span className="text-muted">(opcjonalnie)</span>
        <input name="email" type="email" className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Notatka</span> <span className="text-muted">(opcjonalnie)</span>
        <input name="note" maxLength={500} placeholder="np. faktura FV/10/2026, polecenie" className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Ważny do</span> <span className="text-muted">(opcjonalnie)</span>
        <input name="expiresAt" type="date" className={`${inputClass} mt-1`} />
      </label>
      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
      {created && (
        <p className="rounded-control bg-brand-light p-3 text-sm text-brand" role="status">
          Utworzono kod: <strong className="font-mono text-base" data-testid="nowy-kod">{created}</strong>
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Tworzenie…" : "Utwórz kod"}
      </button>
    </form>
  );
}
