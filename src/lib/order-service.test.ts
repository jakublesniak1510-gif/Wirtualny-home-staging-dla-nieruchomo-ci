import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * markOrderPaid / cancelOrder / retryCheckout na prostej atrapie Prismy w pamięci
 * (tylko metody używane w tych ścieżkach). E-maile i Stripe są atrapami.
 */

interface FakeOrder {
  id: string;
  publicToken: string;
  status: string;
  paymentStatus: string;
  email: string;
  style: string;
  nip: string | null;
  packageCodeId: string | null;
  packageCreditsUsed: number;
  priceBreakdown: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  [extra: string]: unknown;
}

const db = {
  orders: new Map<string, FakeOrder>(),
  codes: new Map<string, { id: string; creditsLeft: number }>(),
};

function matches(order: FakeOrder, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => (order as unknown as Record<string, unknown>)[key] === value);
}

const fakePrisma = {
  order: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; publicToken?: string } }) => {
      const found = where.id
        ? db.orders.get(where.id)
        : [...db.orders.values()].find((o) => o.publicToken === where.publicToken);
      return found ? { ...found } : null;
    }),
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Partial<FakeOrder> }) => {
      const order = db.orders.get(where.id as string);
      if (!order || !matches(order, where)) return { count: 0 };
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) (order as unknown as Record<string, unknown>)[key] = value;
      }
      return { count: 1 };
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeOrder> }) => {
      const order = db.orders.get(where.id);
      if (!order) throw new Error("not found");
      Object.assign(order, data);
      return { ...order };
    }),
  },
  packageCode: {
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: { creditsLeft: { increment: number } } }) => {
        const code = db.codes.get(where.id);
        if (!code) throw new Error("not found");
        code.creditsLeft += data.creditsLeft.increment;
        return { ...code };
      },
    ),
    updateMany: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string; creditsLeft: { gte: number } };
        data: { creditsLeft: { decrement: number } };
      }) => {
        const code = db.codes.get(where.id);
        if (!code || code.creditsLeft < where.creditsLeft.gte) return { count: 0 };
        code.creditsLeft -= data.creditsLeft.decrement;
        return { count: 1 };
      },
    ),
  },
  $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(fakePrisma)),
};

vi.mock("@/lib/db", () => ({ prisma: fakePrisma }));

const stripeMocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(async () => ({ id: "cs_new", url: "https://checkout.stripe.test/new" })),
  expireCheckoutSession: vi.fn(async () => true),
}));
vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return { ...actual, ...stripeMocks };
});

const emailMocks = vi.hoisted(() => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return { ...actual, sendEmail: emailMocks.sendEmail };
});

const { cancelOrder, markOrderPaid, retryCheckout } = await import("@/lib/order-service");
const { calculateOrderPrice } = await import("@/lib/pricing");

function seedOrderWithCredits(): void {
  db.orders.clear();
  db.codes.clear();
  // Kod miał 3 kredyty, zamówienie (3 zdjęcia + dodatek) zarezerwowało 2.
  db.codes.set("code1", { id: "code1", creditsLeft: 1 });
  const breakdown = calculateOrderPrice({ photoCount: 3, addons: ["noc-dzien"], packageCredits: 2 });
  db.orders.set("o1", {
    id: "o1",
    publicToken: "tok_o1_xxxxxxxxxxxxxxxx",
    status: "NEW",
    paymentStatus: "UNPAID",
    email: "a@b.pl",
    style: "skandynawski",
    nip: null,
    packageCodeId: "code1",
    packageCreditsUsed: breakdown.creditsUsed,
    priceBreakdown: JSON.stringify(breakdown),
    stripeSessionId: "cs_old",
    stripePaymentIntentId: null,
    paidAt: null,
    cancelledAt: null,
    createdAt: new Date("2026-10-14T10:00:00Z"),
    totalAmount: breakdown.total,
    photoCount: breakdown.photoCount,
    addons: JSON.stringify(breakdown.addonSlugs),
    express: false,
    isSample: false,
    name: null,
    phone: null,
    company: null,
    notes: null,
    deliveredAt: null,
  });
}

describe("markOrderPaid po anulowaniu", () => {
  beforeEach(() => {
    seedOrderWithCredits();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("anulowanie zwraca kredyty, a późniejsza płatność rezerwuje je ponownie", async () => {
    expect(await cancelOrder("o1")).toBe(true);
    expect(db.codes.get("code1")?.creditsLeft).toBe(3);

    expect(await markOrderPaid("o1", { sessionId: "cs_old" })).toBe(true);
    const order = db.orders.get("o1");
    expect(order?.paymentStatus).toBe("PAID");
    expect(order?.status).toBe("PAID");
    expect(order?.packageCreditsUsed).toBe(2);
    // Kredyty, za które klient dostał rabat w Stripe, nie mogą wrócić do puli.
    expect(db.codes.get("code1")?.creditsLeft).toBe(1);

    // Ponowne anulowanie (np. zwrot) znów je oddaje – bilans się zgadza.
    expect(await cancelOrder("o1")).toBe(true);
    expect(db.codes.get("code1")?.creditsLeft).toBe(3);
  });

  it("zwykła płatność (bez anulowania) nie rusza kredytów; drugi webhook nic nie zmienia", async () => {
    expect(await markOrderPaid("o1", { sessionId: "cs_old" })).toBe(true);
    expect(await markOrderPaid("o1", { sessionId: "cs_old" })).toBe(false);
    expect(db.codes.get("code1")?.creditsLeft).toBe(1);
    expect(db.orders.get("o1")?.packageCreditsUsed).toBe(2);
  });

  it("gdy kredyty zużyto w międzyczasie – płatność przyjęta, ostrzeżenie w logach, licznik nie spada pod zero", async () => {
    await cancelOrder("o1");
    db.codes.set("code1", { id: "code1", creditsLeft: 0 });
    expect(await markOrderPaid("o1")).toBe(true);
    expect(db.codes.get("code1")?.creditsLeft).toBe(0);
    expect(db.orders.get("o1")?.packageCreditsUsed).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("retryCheckout", () => {
  beforeEach(() => {
    seedOrderWithCredits();
    stripeMocks.expireCheckoutSession.mockClear();
  });

  it("wygasza poprzednią sesję Stripe dopiero po zapisaniu nowej", async () => {
    stripeMocks.expireCheckoutSession.mockImplementationOnce(async () => {
      // webhook `expired` starej sesji przyszedłby teraz – zamówienie musi już wskazywać nową
      expect(db.orders.get("o1")?.stripeSessionId).toBe("cs_new");
      return true;
    });
    const url = await retryCheckout("tok_o1_xxxxxxxxxxxxxxxx");
    expect(url).toBe("https://checkout.stripe.test/new");
    expect(stripeMocks.expireCheckoutSession).toHaveBeenCalledWith("cs_old");
    // webhook `expired` dla starej sesji nie anuluje zamówienia
    expect(await cancelOrder("o1", { onlyIfUnpaid: true, sessionId: "cs_old" })).toBe(false);
  });
});
