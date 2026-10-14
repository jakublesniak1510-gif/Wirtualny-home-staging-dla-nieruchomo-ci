"use client";

import { useState } from "react";

/** Ponowne rozpoczęcie płatności dla nieopłaconego zamówienia. */
export function RetryPaymentButton({ token, className = "btn-primary" }: { token: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(token)}/checkout`, { method: "POST" });
      const body = (await response.json()) as { url?: string; error?: string };
      if (response.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error ?? "Nie udało się rozpocząć płatności.");
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    }
    setBusy(false);
  }

  return (
    <div>
      <button type="button" onClick={retry} disabled={busy} className={className}>
        {busy ? "Przekierowuję…" : "Wróć do płatności"}
      </button>
      {error && (
        <p className="mt-2 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
