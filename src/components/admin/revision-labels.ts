/** Etykiety i kolory statusów zgłoszeń poprawek (wspólne dla serwera i klienta). */

export const REVISION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Nowe",
  IN_PROGRESS: "W realizacji",
  DONE: "Zrobione",
  REJECTED: "Odrzucone",
};

export const REVISION_STATUS_TONES: Record<string, string> = {
  OPEN: "bg-danger/10 text-danger",
  IN_PROGRESS: "bg-brand-light text-brand",
  DONE: "bg-success/15 text-success",
  REJECTED: "bg-line text-muted",
};
