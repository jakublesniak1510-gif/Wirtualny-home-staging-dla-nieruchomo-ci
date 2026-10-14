import { beforeEach, describe, expect, it } from "vitest";
import { getClientIp, rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("blokuje po przekroczeniu limitu i resetuje po oknie", () => {
    const opts = { limit: 3, windowMs: 1000 };
    const now = 1_000_000;
    expect(rateLimit("k", opts, now).ok).toBe(true);
    expect(rateLimit("k", opts, now).ok).toBe(true);
    expect(rateLimit("k", opts, now).remaining).toBe(0);
    const blocked = rateLimit("k", opts, now + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(1);
    expect(rateLimit("inny", opts, now).ok).toBe(true);
    expect(rateLimit("k", opts, now + 1001).ok).toBe(true);
  });
});

describe("getClientIp", () => {
  it("bierze pierwszy adres z X-Forwarded-For", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(getClientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
