"use client";

import { useSyncExternalStore } from "react";
import { formatDateTimePL } from "@/lib/format";
import { formatRemaining } from "./remaining";

/** Bieżąca minuta (odświeżana co 30 s – licznik zmienia się najpóźniej pół minuty po pełnej minucie). */
function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);

interface DeadlineCountdownProps {
  /** Termin realizacji (ISO). */
  deadline: string;
  /** Czas renderu na serwerze (ms) – ta sama wartość przy hydratacji, bez rozjazdu HTML. */
  serverNow: number;
}

/** „Gotowe najpóźniej: <data> (pozostało X h Y min)”; po terminie – przeprosiny za opóźnienie. */
export function DeadlineCountdown({ deadline, serverNow }: DeadlineCountdownProps) {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => Math.floor(serverNow / 60_000));
  const due = new Date(deadline);
  const remaining = formatRemaining(due, new Date(minute * 60_000));

  if (!remaining) {
    return (
      <p className="text-sm text-ink" role="status" data-testid="deadline">
        <strong>Pracujemy nad zamówieniem, przepraszamy za opóźnienie.</strong> Planowany termin minął{" "}
        {formatDateTimePL(due)} – wizualizacje są na ostatniej prostej, a gdy będą gotowe, od razu wyślemy e-mail.
      </p>
    );
  }
  return (
    <p className="text-sm text-ink" data-testid="deadline">
      Gotowe najpóźniej: <strong>{formatDateTimePL(due)}</strong>{" "}
      <span className="whitespace-nowrap text-muted">(pozostało {remaining})</span>
    </p>
  );
}
