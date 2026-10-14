"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REVISION_STATUS_LABELS, REVISION_STATUS_TONES } from "@/components/admin/revision-labels";

export interface RevisionView {
  id: string;
  photoLabel: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const ACTIONS = [
  { status: "IN_PROGRESS", label: "W realizacji" },
  { status: "DONE", label: "Zrobione" },
  { status: "REJECTED", label: "Odrzuć" },
] as const;

function RevisionItem({ revision }: { revision: RevisionView }) {
  const router = useRouter();
  const [reply, setReply] = useState(revision.reply ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function update(status: string) {
    if (status === "REJECTED" && !reply.trim() && !window.confirm("Odrzucić bez odpowiedzi dla klienta?")) return;
    setBusy(status);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/revisions/${revision.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reply }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) setMessage({ ok: false, text: body.error ?? "Nie udało się zapisać." });
      else {
        setMessage({ ok: true, text: status === "DONE" ? "Zapisano – klient dostanie powiadomienie." : "Zapisano." });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  return (
    <li className="py-3" data-testid="poprawka">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${REVISION_STATUS_TONES[revision.status] ?? "bg-line"}`}>
          {REVISION_STATUS_LABELS[revision.status] ?? revision.status}
        </span>
        <span className="font-medium text-ink">{revision.photoLabel}</span>
        <span className="text-xs text-muted">zgłoszono {revision.createdAt}</span>
        {revision.resolvedAt && <span className="text-xs text-muted">· zamknięto {revision.resolvedAt}</span>}
      </div>
      <p className="mt-1.5 whitespace-pre-line rounded-control bg-cream p-3 text-sm text-ink">{revision.message}</p>
      <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-muted">
        Odpowiedź dla klienta
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          rows={2}
          maxLength={2000}
          className="mt-1 block w-full rounded-control border border-line bg-surface px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={busy !== null}
            onClick={() => void update(action.status)}
            className={`rounded-control border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              action.status === "REJECTED" ? "border-danger/30 text-danger hover:bg-danger/10" : "border-line hover:border-brand hover:bg-brand-light"
            } ${revision.status === action.status ? "ring-2 ring-brand" : ""}`}
          >
            {busy === action.status ? "…" : action.label}
          </button>
        ))}
      </div>
      {message && (
        <p className={`mt-1.5 text-sm ${message.ok ? "text-success" : "text-danger"}`} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}
    </li>
  );
}

/** Zgłoszenia poprawek zamówienia: zmiana statusu i odpowiedź dla klienta. */
export function RevisionList({ revisions }: { revisions: RevisionView[] }) {
  if (revisions.length === 0) return <p className="text-sm text-muted">Brak zgłoszeń poprawek.</p>;
  return (
    <ul className="divide-y divide-line">
      {revisions.map((revision) => (
        <RevisionItem key={revision.id} revision={revision} />
      ))}
    </ul>
  );
}
