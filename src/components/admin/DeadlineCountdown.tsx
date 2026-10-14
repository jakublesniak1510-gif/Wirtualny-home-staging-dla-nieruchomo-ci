"use client";

import { useEffect, useState } from "react";

function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${mins} min`;
  return `${mins} min`;
}

/** Odliczanie do terminu realizacji; po terminie – na czerwono. */
export function DeadlineCountdown({ deadline, active, now }: { deadline: string; active: boolean; now: string }) {
  const [current, setCurrent] = useState(() => Date.parse(now));
  useEffect(() => {
    if (!active) return;
    const tick = () => setCurrent(Date.now());
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return <span className="text-muted">—</span>;
  const diff = Date.parse(deadline) - current;
  if (diff < 0) {
    return (
      <span className="font-semibold text-danger" data-testid="termin">
        po terminie o {formatDuration(-diff)}
      </span>
    );
  }
  return (
    <span className={diff < 3 * 3_600_000 ? "font-semibold text-sand-dark" : "text-ink"} data-testid="termin">
      zostało {formatDuration(diff)}
    </span>
  );
}
