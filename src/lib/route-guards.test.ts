import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Testy tras: atomowe PAID → IN_PROGRESS (jeden e-mail), globalny limit linków logowania
 * na adres e-mail i globalny limit prób logowania do panelu.
 */

const state = vi.hoisted(() => ({
  order: { id: "o1", status: "PAID", paymentStatus: "PAID", deliveredAt: null as Date | null },
  notify: vi.fn(async () => undefined),
  requestMagicLink: vi.fn(async () => true),
  headers: new Headers(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(async () => ({ ...state.order })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(state.order, data);
        return { ...state.order };
      }),
      updateMany: vi.fn(async ({ where, data }: { where: { status?: string }; data: Record<string, unknown> }) => {
        if (where.status && state.order.status !== where.status) return { count: 0 };
        Object.assign(state.order, data);
        return { count: 1 };
      }),
    },
  },
}));

vi.mock("@/lib/admin-notify", () => ({
  notifyOrderInProgressSafe: state.notify,
  notifyRevisionResolvedSafe: vi.fn(async () => undefined),
}));

vi.mock("@/lib/magic-link", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/magic-link")>();
  return { ...actual, requestMagicLink: state.requestMagicLink };
});

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (fn: () => unknown) => void fn() };
});

vi.mock("next/headers", () => ({ headers: async () => state.headers, cookies: async () => ({ get: () => undefined, set: () => undefined }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));

process.env.ADMIN_SESSION_SECRET = "x".repeat(40);
process.env.ADMIN_PASSWORD = "poprawne-haslo";

const { createSessionValue, ADMIN_COOKIE } = await import("@/lib/admin-auth");
const statusRoute = await import("@/app/api/admin/orders/[id]/status/route");
const magicRoute = await import("@/app/api/magic-link/route");
const { loginAction } = await import("@/app/admin/actions");
const { resetRateLimits } = await import("@/lib/rate-limit");

function adminStatusRequest(status: string): Request {
  return new Request("http://localhost/api/admin/orders/o1/status", {
    method: "POST",
    headers: {
      cookie: `${ADMIN_COOKIE}=${createSessionValue()}`,
      origin: "http://localhost",
      host: "localhost",
      "content-type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

const ctx = { params: Promise.resolve({ id: "o1" }) } as never;

describe("POST /api/admin/orders/<id>/status", () => {
  beforeEach(() => {
    state.order.status = "PAID";
    state.notify.mockClear();
  });

  it("dwa równoległe kliknięcia „W realizacji” → jeden e-mail do klienta", async () => {
    const [a, b] = await Promise.all([
      statusRoute.POST(adminStatusRequest("IN_PROGRESS"), ctx),
      statusRoute.POST(adminStatusRequest("IN_PROGRESS"), ctx),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(state.order.status).toBe("IN_PROGRESS");
    expect(state.notify).toHaveBeenCalledTimes(1);
  });

  it("READY nie wysyła e-maila „w realizacji”", async () => {
    const response = await statusRoute.POST(adminStatusRequest("READY"), ctx);
    expect(response.status).toBe(200);
    expect(state.order.status).toBe("READY");
    expect(state.notify).not.toHaveBeenCalled();
  });
});

describe("POST /api/magic-link – limit na adres e-mail niezależny od IP", () => {
  beforeEach(() => {
    resetRateLimits();
    state.requestMagicLink.mockClear();
  });

  it("z wielu IP do jednej skrzynki wychodzi najwyżej 5 linków na godzinę, odpowiedź zawsze ta sama", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const response = await magicRoute.POST(
        new Request("http://localhost/api/magic-link", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${i}` },
          body: JSON.stringify({ email: "Ofiara@Example.pl" }),
        }),
      );
      statuses.push(response.status);
    }
    expect(new Set(statuses)).toEqual(new Set([200]));
    expect(state.requestMagicLink).toHaveBeenCalledTimes(5);
  });
});

describe("loginAction – globalny limit prób", () => {
  beforeEach(() => resetRateLimits());

  it("rotowanie X-Forwarded-For nie omija limitu", async () => {
    const results: Array<string | undefined> = [];
    for (let i = 0; i < 60; i += 1) {
      state.headers = new Headers({ "x-forwarded-for": `192.0.2.${i}` });
      const form = new FormData();
      form.set("password", `zgadywane-${i}`);
      results.push((await loginAction({}, form)).error);
    }
    expect(results.filter((e) => e?.startsWith("Zbyt wiele prób")).length).toBeGreaterThan(0);
    expect(results.filter((e) => e === "Nieprawidłowe hasło.").length).toBeLessThanOrEqual(50);
  });
});
