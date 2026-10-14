import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface FakeLink {
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

const links: FakeLink[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    magicLink: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { tokenHash: string; usedAt: null; expiresAt: { gt: Date } };
        data: { usedAt: Date };
      }) => {
        let count = 0;
        for (const link of links) {
          if (link.tokenHash === where.tokenHash && link.usedAt === null && link.expiresAt > where.expiresAt.gt) {
            link.usedAt = data.usedAt;
            count += 1;
          }
        }
        return { count };
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) =>
        links.find((link) => link.tokenHash === where.tokenHash) ?? null,
    },
  },
}));

const ml = await import("@/lib/magic-link");

describe("magic-link – tokeny", () => {
  it("token ma 32 bajty (43 znaki base64url) i jest losowy", () => {
    const a = ml.generateMagicToken();
    const b = ml.generateMagicToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(a, "base64url")).toHaveLength(32);
    expect(a).not.toBe(b);
    expect(ml.isMagicTokenFormat(a)).toBe(true);
    expect(ml.isMagicTokenFormat("krotki")).toBe(false);
  });

  it("w bazie trzymamy hasz SHA-256 (hex), nie token", () => {
    const token = ml.generateMagicToken();
    const hash = ml.hashMagicToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(ml.hashMagicToken(token)).toBe(hash);
    expect(ml.hashMagicToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("link wygasa po 30 minutach i po użyciu", () => {
    const now = new Date("2026-10-14T10:00:00Z");
    const expiresAt = ml.magicLinkExpiry(now);
    expect(expiresAt.getTime() - now.getTime()).toBe(ml.MAGIC_LINK_TTL_MINUTES * 60_000);
    expect(ml.MAGIC_LINK_TTL_MINUTES).toBe(30);
    expect(ml.isMagicLinkUsable({ expiresAt, usedAt: null }, new Date(expiresAt.getTime() - 1))).toBe(true);
    expect(ml.isMagicLinkUsable({ expiresAt, usedAt: null }, expiresAt)).toBe(false);
    expect(ml.isMagicLinkUsable({ expiresAt, usedAt: now }, now)).toBe(false);
  });
});

describe("magic-link – consumeMagicLink", () => {
  beforeEach(() => {
    links.length = 0;
  });

  it("jest jednorazowy", async () => {
    const now = new Date("2026-10-14T10:00:00Z");
    const token = ml.generateMagicToken();
    links.push({ email: "jan@biuro.pl", tokenHash: ml.hashMagicToken(token), expiresAt: ml.magicLinkExpiry(now), usedAt: null });
    expect(await ml.consumeMagicLink(token, now)).toBe("jan@biuro.pl");
    expect(await ml.consumeMagicLink(token, now)).toBeNull();
  });

  it("odrzuca przeterminowany, nieznany i źle sformatowany token", async () => {
    const now = new Date("2026-10-14T10:00:00Z");
    const token = ml.generateMagicToken();
    links.push({ email: "jan@biuro.pl", tokenHash: ml.hashMagicToken(token), expiresAt: ml.magicLinkExpiry(now), usedAt: null });
    expect(await ml.consumeMagicLink(token, new Date(now.getTime() + 31 * 60_000))).toBeNull();
    expect(await ml.consumeMagicLink(ml.generateMagicToken(), now)).toBeNull();
    expect(await ml.consumeMagicLink("../../etc", now)).toBeNull();
  });
});

describe("magic-link – sesja klienta", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "s".repeat(40);
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it("podpisana sesja na 24 h z e-mailem", () => {
    const now = Date.now();
    const value = ml.createClientSessionValue("Jan@Biuro.pl", now);
    expect(ml.verifyClientSessionValue(value, now)).toBe("jan@biuro.pl");
    expect(ml.verifyClientSessionValue(value, now + 23 * 3_600_000)).toBe("jan@biuro.pl");
    expect(ml.verifyClientSessionValue(value, now + 25 * 3_600_000)).toBeNull();
  });

  it("odporna na podmianę e-maila, daty i sekretu", () => {
    const now = Date.now();
    const value = ml.createClientSessionValue("jan@biuro.pl", now);
    const [, expires, sig] = value.split(".");
    const other = Buffer.from("anna@biuro.pl").toString("base64url");
    expect(ml.verifyClientSessionValue(`${other}.${expires}.${sig}`, now)).toBeNull();
    const [email] = value.split(".");
    expect(ml.verifyClientSessionValue(`${email}.${Number(expires) + 1000}.${sig}`, now)).toBeNull();
    expect(ml.verifyClientSessionValue("śmieci", now)).toBeNull();
    expect(ml.verifyClientSessionValue(undefined, now)).toBeNull();
    process.env.ADMIN_SESSION_SECRET = "t".repeat(40);
    expect(ml.verifyClientSessionValue(value, now)).toBeNull();
  });
});
