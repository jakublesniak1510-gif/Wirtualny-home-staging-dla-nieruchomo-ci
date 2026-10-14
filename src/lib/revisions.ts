import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminRevisionRequestEmail, revisionDoneEmail, sendEmail } from "@/lib/email";
import type { EmailResult, RevisionEmailPhoto, RevisionResolutionItem } from "@/lib/email";
import { toEmailOrder } from "@/lib/order-service";
import { INCLUDED_REVISIONS, REVISION_WINDOW_DAYS } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/site";

/**
 * Zgłoszenia poprawek od klienta.
 *
 * Model: jedno zgłoszenie (runda) może dotyczyć wielu zdjęć – zapisujemy je jako osobne rekordy
 * RevisionRequest (po jednym na zdjęcie, `photoId = null` = „całe zamówienie”) utworzone w jednej
 * transakcji z tym samym `message` i IDENTYCZNYM `createdAt`. Runda = grupa rekordów z tej samej
 * minuty. Do limitu INCLUDED_REVISIONS liczą się rundy w statusach OPEN / IN_PROGRESS / DONE
 * (odrzucone – REJECTED – nie zużywają limitu).
 */

export const REVISION_STATUSES = ["OPEN", "IN_PROGRESS", "DONE", "REJECTED"] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];

export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  OPEN: "Przyjęte",
  IN_PROGRESS: "W realizacji",
  DONE: "Wykonane",
  REJECTED: "Odrzucone",
};

/** Statusy zgłoszeń, które zużywają bezpłatną rundę poprawek. */
export const COUNTED_REVISION_STATUSES: readonly string[] = ["OPEN", "IN_PROGRESS", "DONE"];

export const REVISION_MESSAGE_MIN = 10;
export const REVISION_MESSAGE_MAX = 1000;

export function getRevisionStatusLabel(status: string): string {
  return (REVISION_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export class RevisionError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "RevisionError";
    this.status = status;
  }
}

// --- czysta logika ------------------------------------------------------------------

/** Klucz rundy: minuta utworzenia (rekordy jednej rundy mają identyczny createdAt). */
export function revisionRoundKey(createdAt: Date): number {
  return Math.floor(createdAt.getTime() / 60_000);
}

/** Grupuje zgłoszenia w rundy (od najnowszej), zachowując kolejność rekordów w rundzie. */
export function groupRevisionRounds<T extends { createdAt: Date }>(revisions: readonly T[]): T[][] {
  const groups = new Map<number, T[]>();
  for (const revision of revisions) {
    const key = revisionRoundKey(revision.createdAt);
    const group = groups.get(key);
    if (group) group.push(revision);
    else groups.set(key, [revision]);
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([, group]) => group);
}

/** Liczba rund zużywających limit (rekordy OPEN / IN_PROGRESS / DONE pogrupowane po minucie). */
export function countRounds(revisions: ReadonlyArray<{ createdAt: Date; status: string }>): number {
  return groupRevisionRounds(revisions.filter((r) => COUNTED_REVISION_STATUSES.includes(r.status))).length;
}

/** Koniec okna poprawek (null, gdy zamówienie nie zostało jeszcze dostarczone). */
export function getRevisionWindowEnd(deliveredAt: Date | null): Date | null {
  return deliveredAt ? new Date(deliveredAt.getTime() + REVISION_WINDOW_DAYS * 24 * 3_600_000) : null;
}

export type RevisionBlockReason = "status" | "window" | "limit";

export interface RevisionEligibility {
  allowed: boolean;
  reason: RevisionBlockReason | null;
  roundsUsed: number;
  roundsLeft: number;
  /** Do kiedy można zgłosić bezpłatną poprawkę (null – okno jeszcze nie wystartowało). */
  windowEndsAt: Date | null;
}

/**
 * Czy klient może zgłosić bezpłatną poprawkę: status READY/DELIVERED, w ciągu REVISION_WINDOW_DAYS
 * od dostarczenia (READY bez daty dostarczenia – okno jeszcze nie biegnie) i nie wykorzystał
 * INCLUDED_REVISIONS rund.
 */
export function getRevisionEligibility(input: {
  status: OrderStatus;
  deliveredAt: Date | null;
  roundsUsed: number;
  now?: Date;
}): RevisionEligibility {
  const now = input.now ?? new Date();
  const windowEndsAt = getRevisionWindowEnd(input.deliveredAt);
  const roundsLeft = Math.max(0, INCLUDED_REVISIONS - input.roundsUsed);
  const base = { roundsUsed: input.roundsUsed, roundsLeft, windowEndsAt };
  if (input.status !== "READY" && input.status !== "DELIVERED") {
    return { ...base, allowed: false, reason: "status" };
  }
  if (windowEndsAt && now.getTime() >= windowEndsAt.getTime()) {
    return { ...base, allowed: false, reason: "window" };
  }
  if (roundsLeft <= 0) return { ...base, allowed: false, reason: "limit" };
  return { ...base, allowed: true, reason: null };
}

/**
 * Czy po rozwiązaniu `revisionId` należy wysłać e-mail dla całej rundy: wszystkie rekordy rundy
 * są zamknięte (DONE/REJECTED), a `revisionId` jest ostatnio zamkniętym (max resolvedAt, potem id).
 * Dzięki temu przy zamykaniu rekordów po kolei (albo hurtem) wychodzi dokładnie jeden e-mail.
 */
export function shouldNotifyRound(
  revisionId: string,
  round: ReadonlyArray<{ id: string; status: string; resolvedAt: Date | null }>,
): boolean {
  if (round.length === 0) return false;
  if (round.some((r) => r.status !== "DONE" && r.status !== "REJECTED")) return false;
  const last = [...round].sort(
    (a, b) => (a.resolvedAt?.getTime() ?? 0) - (b.resolvedAt?.getTime() ?? 0) || a.id.localeCompare(b.id),
  )[round.length - 1];
  return last?.id === revisionId;
}

// --- baza ---------------------------------------------------------------------------

/** Liczba wykorzystanych rund bezpłatnych poprawek zamówienia. */
export async function countRevisionRounds(orderId: string): Promise<number> {
  const revisions = await prisma.revisionRequest.findMany({
    where: { orderId, status: { in: [...COUNTED_REVISION_STATUSES] } },
    select: { createdAt: true, status: true },
  });
  return countRounds(revisions);
}

export interface CreateRevisionInput {
  token: string;
  /** Wybrane zdjęcia (puste = „całe zamówienie”). */
  photoIds: readonly string[];
  message: string;
}

/** Tworzy rundę poprawek (rekord na każde zdjęcie) i powiadamia operatora. */
export async function createRevisionRequest(input: CreateRevisionInput): Promise<{ count: number }> {
  const order = await prisma.order.findUnique({
    where: { publicToken: input.token },
    include: { photos: { orderBy: { sortOrder: "asc" }, select: { id: true, originalName: true } } },
  });
  if (!order) throw new RevisionError(404, "Nie znaleziono zamówienia.");

  const uniqueIds = [...new Set(input.photoIds)];
  const indexById = new Map(order.photos.map((photo, index) => [photo.id, index]));
  if (uniqueIds.some((id) => !indexById.has(id))) {
    throw new RevisionError(400, "Wybrano zdjęcie, które nie należy do tego zamówienia.");
  }
  const message = input.message.trim();
  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    const existing = await tx.revisionRequest.findMany({
      where: { orderId: order.id, status: { in: [...COUNTED_REVISION_STATUSES] } },
      select: { createdAt: true, status: true },
    });
    const eligibility = getRevisionEligibility({
      status: order.status,
      deliveredAt: order.deliveredAt,
      roundsUsed: countRounds(existing),
      now,
    });
    if (!eligibility.allowed) {
      const reasons: Record<RevisionBlockReason, string> = {
        status: "Poprawki można zgłaszać dopiero po otrzymaniu gotowych wizualizacji.",
        window: `Minęło ${REVISION_WINDOW_DAYS} dni od dostarczenia – bezpłatna poprawka już nie przysługuje. Napisz do nas, przygotujemy wycenę.`,
        limit: "Bezpłatna runda poprawek została już wykorzystana. Napisz do nas, przygotujemy wycenę kolejnej poprawki.",
      };
      throw new RevisionError(409, reasons[eligibility.reason ?? "status"]);
    }
    const targets: Array<string | null> = uniqueIds.length > 0 ? uniqueIds : [null];
    for (const photoId of targets) {
      await tx.revisionRequest.create({
        data: { orderId: order.id, photoId, message, status: "OPEN", createdAt: now },
      });
    }
    return targets;
  });

  const photos: RevisionEmailPhoto[] = created.map((photoId) => {
    if (photoId === null) return { index: null };
    const index = indexById.get(photoId) ?? 0;
    return { index: index + 1, name: order.photos[index]?.originalName };
  });
  const sent = await sendEmail(
    adminRevisionRequestEmail({
      order: toEmailOrder(order),
      message,
      photos,
      adminUrl: absoluteUrl(`/admin/zamowienia/${order.id}`),
    }),
  );
  if (!sent.ok) console.error("[revisions] Nie wysłano powiadomienia do operatora:", sent.error);
  return { count: created.length };
}

export interface RevisionNotifyResult extends EmailResult {
  skipped?: "not-found" | "not-resolved" | "round-pending" | "not-last";
}

/**
 * E-mail do klienta po zamknięciu zgłoszenia poprawki (szablon `revisionDoneEmail`).
 *
 * KONTRAKT dla panelu admina: wywołaj po KAŻDEJ zmianie statusu rekordu na DONE lub REJECTED
 * (z ustawionym `resolvedAt` i ewentualnym `reply`). E-mail wychodzi raz na rundę – gdy wszystkie
 * rekordy rundy są zamknięte i `revisionId` jest ostatnio zamkniętym (patrz `shouldNotifyRound`).
 * Nie wywołuj ponownie dla tego samego rekordu (to wysłałoby e-mail drugi raz). Nie rzuca wyjątków.
 */
export async function notifyRevisionResolved(revisionId: string): Promise<RevisionNotifyResult> {
  try {
    const revision = await prisma.revisionRequest.findUnique({ where: { id: revisionId } });
    if (!revision) return { ok: false, skipped: "not-found", error: "Nie znaleziono zgłoszenia." };
    if (revision.status !== "DONE" && revision.status !== "REJECTED") {
      return { ok: false, skipped: "not-resolved", error: "Zgłoszenie nie jest zamknięte." };
    }
    const minute = revisionRoundKey(revision.createdAt) * 60_000;
    const round = await prisma.revisionRequest.findMany({
      where: {
        orderId: revision.orderId,
        createdAt: { gte: new Date(minute), lt: new Date(minute + 60_000) },
      },
      orderBy: { createdAt: "asc" },
    });
    if (round.some((r) => r.status !== "DONE" && r.status !== "REJECTED")) {
      return { ok: false, skipped: "round-pending", error: "Pozostałe zdjęcia z tej rundy są jeszcze w realizacji." };
    }
    if (!shouldNotifyRound(revision.id, round)) {
      return { ok: false, skipped: "not-last", error: "E-mail dla tej rundy wyśle ostatnio zamknięte zgłoszenie." };
    }
    const order = await prisma.order.findUnique({
      where: { id: revision.orderId },
      include: { photos: { orderBy: { sortOrder: "asc" }, select: { id: true, originalName: true } } },
    });
    if (!order) return { ok: false, skipped: "not-found", error: "Nie znaleziono zamówienia." };
    const indexById = new Map(order.photos.map((photo, index) => [photo.id, index]));
    const items: RevisionResolutionItem[] = round.map((r) => {
      const index = r.photoId ? indexById.get(r.photoId) : undefined;
      return {
        index: index === undefined ? null : index + 1,
        name: index === undefined ? null : order.photos[index]?.originalName,
        status: r.status,
        reply: r.reply,
      };
    });
    return await sendEmail(revisionDoneEmail({ order: toEmailOrder(order), message: revision.message, items }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[revisions] Błąd powiadomienia o poprawce:", msg);
    return { ok: false, error: msg };
  }
}
