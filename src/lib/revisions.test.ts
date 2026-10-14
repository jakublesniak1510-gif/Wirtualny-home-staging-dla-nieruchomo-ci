import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

const {
  countRounds,
  getRevisionEligibility,
  getRevisionWindowEnd,
  groupRevisionRounds,
  shouldNotifyRound,
} = await import("@/lib/revisions");
const { INCLUDED_REVISIONS, REVISION_WINDOW_DAYS } = await import("@/lib/pricing");

const DAY = 24 * 3_600_000;
const delivered = new Date("2026-10-10T12:00:00Z");

describe("rundy poprawek", () => {
  const t1 = new Date("2026-10-11T10:00:05Z");
  const t2 = new Date("2026-10-12T09:30:00Z");

  it("rekordy z tej samej minuty to jedna runda (wiele zdjęć w jednym zgłoszeniu)", () => {
    const rounds = groupRevisionRounds([
      { id: "a", createdAt: t1 },
      { id: "b", createdAt: t1 },
      { id: "c", createdAt: new Date(t1.getTime() + 20_000) },
      { id: "d", createdAt: t2 },
    ]);
    expect(rounds.map((round) => round.map((r) => r.id))).toEqual([["d"], ["a", "b", "c"]]);
  });

  it("liczy tylko OPEN / IN_PROGRESS / DONE – odrzucone nie zużywają limitu", () => {
    expect(countRounds([])).toBe(0);
    expect(
      countRounds([
        { createdAt: t1, status: "OPEN" },
        { createdAt: t1, status: "DONE" },
      ]),
    ).toBe(1);
    expect(
      countRounds([
        { createdAt: t1, status: "DONE" },
        { createdAt: t2, status: "IN_PROGRESS" },
      ]),
    ).toBe(2);
    expect(countRounds([{ createdAt: t1, status: "REJECTED" }])).toBe(0);
  });
});

describe("getRevisionEligibility", () => {
  it("pozwala w oknie i przed wykorzystaniem limitu", () => {
    const result = getRevisionEligibility({
      status: "DELIVERED",
      deliveredAt: delivered,
      roundsUsed: 0,
      now: new Date(delivered.getTime() + DAY),
    });
    expect(result).toMatchObject({ allowed: true, reason: null, roundsLeft: INCLUDED_REVISIONS });
    expect(result.windowEndsAt?.toISOString()).toBe(getRevisionWindowEnd(delivered)?.toISOString());
  });

  it("zamyka okno dokładnie po REVISION_WINDOW_DAYS dniach", () => {
    const end = delivered.getTime() + REVISION_WINDOW_DAYS * DAY;
    expect(
      getRevisionEligibility({ status: "DELIVERED", deliveredAt: delivered, roundsUsed: 0, now: new Date(end - 1) }).allowed,
    ).toBe(true);
    expect(
      getRevisionEligibility({ status: "DELIVERED", deliveredAt: delivered, roundsUsed: 0, now: new Date(end) }),
    ).toMatchObject({ allowed: false, reason: "window" });
  });

  it("blokuje po wykorzystaniu rund", () => {
    expect(
      getRevisionEligibility({
        status: "DELIVERED",
        deliveredAt: delivered,
        roundsUsed: INCLUDED_REVISIONS,
        now: new Date(delivered.getTime() + DAY),
      }),
    ).toMatchObject({ allowed: false, reason: "limit", roundsLeft: 0 });
  });

  it("wymaga statusu READY/DELIVERED; READY bez daty dostarczenia – okno jeszcze nie biegnie", () => {
    expect(getRevisionEligibility({ status: "IN_PROGRESS", deliveredAt: null, roundsUsed: 0 })).toMatchObject({
      allowed: false,
      reason: "status",
    });
    expect(getRevisionEligibility({ status: "READY", deliveredAt: null, roundsUsed: 0 })).toMatchObject({
      allowed: true,
      windowEndsAt: null,
    });
  });
});

describe("shouldNotifyRound", () => {
  const r = (id: string, status: string, resolvedAt: string | null) => ({
    id,
    status,
    resolvedAt: resolvedAt ? new Date(resolvedAt) : null,
  });

  it("czeka, aż cała runda będzie zamknięta", () => {
    const round = [r("a", "DONE", "2026-10-12T10:00:00Z"), r("b", "OPEN", null)];
    expect(shouldNotifyRound("a", round)).toBe(false);
  });

  it("wysyła tylko z ostatnio zamkniętego rekordu (jeden e-mail na rundę)", () => {
    const round = [r("a", "DONE", "2026-10-12T10:00:00Z"), r("b", "REJECTED", "2026-10-12T11:00:00Z")];
    expect(shouldNotifyRound("a", round)).toBe(false);
    expect(shouldNotifyRound("b", round)).toBe(true);
  });

  it("przy zamknięciu hurtem (ta sama data) wybiera jeden rekord po id", () => {
    const round = [r("b", "DONE", "2026-10-12T10:00:00Z"), r("a", "DONE", "2026-10-12T10:00:00Z")];
    expect([shouldNotifyRound("a", round), shouldNotifyRound("b", round)]).toEqual([false, true]);
  });
});
