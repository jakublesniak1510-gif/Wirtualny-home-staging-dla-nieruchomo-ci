"use client";

import type { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BUTTONS: ReadonlyArray<{ status: OrderStatus; label: string }> = [
  { status: "IN_PROGRESS", label: "W realizacji" },
  { status: "READY", label: "Gotowe" },
  { status: "DELIVERED", label: "Dostarczone (bez maila)" },
  { status: "CANCELLED", label: "Anuluj" },
];

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  allResultsReady: boolean;
  unpaid: boolean;
}

/** Zmiana statusu i wysyłka maila „gotowe”. */
export function OrderActions({ orderId, status, allResultsReady, unpaid }: OrderActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(url: string, body: unknown, key: string, success: string) {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      setMessage(response.ok ? { ok: true, text: success } : { ok: false, text: data.error ?? "Operacja nie powiodła się." });
      if (response.ok) router.refresh();
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  const cancelled = status === "CANCELLED";

  return (
    <div className="space-y-4">
      <div>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!allResultsReady || cancelled || unpaid || busy !== null}
          onClick={() => call(`/api/admin/orders/${orderId}/deliver`, {}, "deliver", "Wysłano e-mail – status: Dostarczone.")}
        >
          {busy === "deliver" ? "Wysyłanie…" : status === "DELIVERED" ? "Wyślij maila: gotowe (ponownie)" : "Wyślij maila: gotowe"}
        </button>
        {!allResultsReady && !cancelled && (
          <p className="mt-1.5 text-xs text-muted">Dostępne po wgraniu wyników dla wszystkich zdjęć.</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Zmień status</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {BUTTONS.map((button) => (
            <button
              key={button.status}
              type="button"
              disabled={busy !== null || button.status === status || (cancelled && button.status !== "CANCELLED")}
              onClick={() => {
                if (button.status === "CANCELLED" && !window.confirm("Na pewno anulować zamówienie? Kredyty kodu pakietu zostaną zwrócone.")) return;
                void call(`/api/admin/orders/${orderId}/status`, { status: button.status }, button.status, "Zmieniono status.");
              }}
              className={`rounded-control border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                button.status === "CANCELLED"
                  ? "border-danger/30 text-danger hover:bg-danger/10"
                  : "border-line bg-surface text-ink hover:border-brand hover:bg-brand-light"
              } ${button.status === status ? "ring-2 ring-brand" : ""}`}
            >
              {busy === button.status ? "…" : button.label}
            </button>
          ))}
        </div>
      </div>
      {message && (
        <p className={`text-sm font-medium ${message.ok ? "text-success" : "text-danger"}`} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
