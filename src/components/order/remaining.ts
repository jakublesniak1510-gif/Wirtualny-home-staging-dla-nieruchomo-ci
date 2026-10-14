/** Czyste helpery licznika terminu (bez zależności serwerowych – bezpieczne w komponentach klienta). */

/** Pozostały czas do terminu jako „X h Y min” (null, gdy termin minął). */
export function formatRemaining(deadline: Date, now: Date = new Date()): string | null {
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const totalMinutes = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}
