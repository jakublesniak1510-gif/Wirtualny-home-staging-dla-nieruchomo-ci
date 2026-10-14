import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminGuard,
  checkAdminPassword,
  createSessionValue,
  isAdminRequest,
  isSameOriginRequest,
  shouldRenewSession,
  verifySessionValue,
} from "@/lib/admin-auth";

describe("admin-auth", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "tajne-haslo-123";
    process.env.ADMIN_SESSION_SECRET = "x".repeat(40);
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it("sprawdza hasło", () => {
    expect(checkAdminPassword("tajne-haslo-123")).toBe(true);
    expect(checkAdminPassword("zle")).toBe(false);
    delete process.env.ADMIN_PASSWORD;
    expect(checkAdminPassword("")).toBe(false);
  });

  it("podpisana sesja jest ważna 7 dni i odporna na podmianę", () => {
    const now = Date.now();
    const value = createSessionValue(now);
    expect(verifySessionValue(value, now)).toBe(true);
    expect(verifySessionValue(value, now + 8 * 24 * 3_600_000)).toBe(false);
    const [expires, sig] = value.split(".");
    expect(verifySessionValue(`${Number(expires) + 1000}.${sig}`, now)).toBe(false);
    expect(verifySessionValue("śmieci", now)).toBe(false);
    process.env.ADMIN_SESSION_SECRET = "y".repeat(40);
    expect(verifySessionValue(value, now)).toBe(false);
  });

  it("czyta ciasteczko z żądania", () => {
    const value = createSessionValue();
    const ok = new Request("http://x/api", { headers: { cookie: `a=1; ws_admin=${value}` } });
    expect(isAdminRequest(ok)).toBe(true);
    expect(isAdminRequest(new Request("http://x/api"))).toBe(false);
  });

  it("CSRF: metody zmieniające dane wymagają zgodnego Origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://wirtualnystaging.pl";
    const cookie = `ws_admin=${createSessionValue()}`;
    const post = (headers: Record<string, string>) =>
      new Request("http://localhost:3000/api/admin/x", { method: "POST", headers: { cookie, host: "localhost:3000", ...headers } });
    expect(isSameOriginRequest(post({ origin: "http://localhost:3000" }))).toBe(true);
    expect(isSameOriginRequest(post({ origin: "https://wirtualnystaging.pl" }))).toBe(true);
    expect(isSameOriginRequest(post({}))).toBe(true);
    expect(isSameOriginRequest(post({ origin: "https://zly.example" }))).toBe(false);
    expect(isSameOriginRequest(post({ origin: "null" }))).toBe(false);
    expect(isSameOriginRequest(post({ origin: "http://localhost:3000", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isAdminRequest(post({ origin: "https://zly.example" }))).toBe(false);
    expect(adminGuard(post({ origin: "https://zly.example" }))?.status).toBe(403);
    expect(adminGuard(post({ origin: "http://localhost:3000" }))).toBeNull();
    expect(adminGuard(new Request("http://localhost:3000/api/admin/x", { method: "POST" }))?.status).toBe(401);
    const get = new Request("http://localhost:3000/api/admin/x", { headers: { cookie, origin: "https://zly.example" } });
    expect(isSameOriginRequest(get)).toBe(true);
  });

  it("odnawia sesję po upływie połowy ważności", () => {
    const now = Date.now();
    const value = createSessionValue(now);
    expect(shouldRenewSession(value, now)).toBe(false);
    expect(shouldRenewSession(value, now + 4 * 24 * 3_600_000)).toBe(true);
    expect(shouldRenewSession(value, now + 8 * 24 * 3_600_000)).toBe(false);
    expect(shouldRenewSession(undefined, now)).toBe(false);
  });
});
