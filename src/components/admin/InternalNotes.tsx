"use client";

import { useEffect, useRef, useState } from "react";

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "error"; text: string };

/** Notatki wewnętrzne operatora – zapis automatyczny (0,8 s po ostatniej zmianie i przy wyjściu z pola). */
export function InternalNotes({ orderId, initial }: { orderId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(text: string) {
    if (text === saved.current) return;
    setState({ kind: "saving" });
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: text }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setState({ kind: "error", text: body.error ?? "Nie udało się zapisać notatki." });
        return;
      }
      saved.current = text;
      setState({ kind: "saved", at: new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) });
    } catch {
      setState({ kind: "error", text: "Błąd połączenia – notatka niezapisana." });
    }
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div>
      <label htmlFor="notatki-wewnetrzne" className="text-xs font-semibold uppercase tracking-wide text-muted">
        Notatki wewnętrzne (niewidoczne dla klienta)
      </label>
      <textarea
        id="notatki-wewnetrzne"
        value={value}
        rows={3}
        maxLength={5000}
        placeholder="np. klient prosił o telefon przed wysyłką, zdjęcie 3 do poprawy…"
        className="mt-1.5 block w-full rounded-control border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        onChange={(event) => {
          const text = event.target.value;
          setValue(text);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => void save(text), 800);
        }}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          void save(value);
        }}
      />
      <p className={`mt-1 text-xs ${state.kind === "error" ? "text-danger" : "text-muted"}`} role="status" aria-live="polite" data-testid="notatki-status">
        {state.kind === "saving" && "Zapisywanie…"}
        {state.kind === "saved" && `Zapisano ${state.at}`}
        {state.kind === "error" && state.text}
        {state.kind === "idle" && "Zapis automatyczny"}
      </p>
    </div>
  );
}
