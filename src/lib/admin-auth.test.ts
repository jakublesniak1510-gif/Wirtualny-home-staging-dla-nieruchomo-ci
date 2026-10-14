import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkAdminPassword, createSessionValue, isAdminRequest, verifySessionValue } from "@/lib/admin-auth";

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
});
