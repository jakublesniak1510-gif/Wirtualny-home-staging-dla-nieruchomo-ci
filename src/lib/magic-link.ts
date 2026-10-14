import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { magicLinkEmail, sendEmail } from "@/lib/email";
import { MissingSecretError, safeEqual, sign } from "@/lib/secrets";
import { ROUTES, absoluteUrl, getSiteUrl } from "@/lib/site";

/**
 * „Moje zamówienia” bez hasła:
 * 1. Klient podaje e-mail → jeśli mamy jego zamówienia/kody, wysyłamy jednorazowy link
 *    `/moje-zamowienia/<token>` (token 32 bajty, w bazie tylko hasz SHA-256, ważny 30 min).
 * 2. Klient otwiera link i potwierdza przyciskiem (skanery poczty nie zużyją linku samym GET-em) →
 *    token zostaje zużyty, ustawiamy ciasteczko HttpOnly `client_session` (24 h) podpisane HMAC
 *    sekretem aplikacji (`secrets.ts`, osobny kontekst – niewymienne z sesją admina).
 */

/** Ścieżka strony „Moje zamówienia” (alias ROUTES.myOrders). */
export const MY_ORDERS_ROUTE = ROUTES.myOrders;
export const MAGIC_LINK_TTL_MINUTES = 30;
export const CLIENT_SESSION_COOKIE = "client_session";
export const CLIENT_SESSION_HOURS = 24;
const SESSION_CONTEXT = "client-session";
const TOKEN_BYTES = 32;
/** 32 bajty w base64url = 43 znaki. */
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function myOrdersLinkPath(token: string): string {
  return `${MY_ORDERS_ROUTE}/${token}`;
}

// --- tokeny ---------------------------------------------------------------------

export function generateMagicToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isMagicTokenFormat(token: string): boolean {
  return TOKEN_RE.test(token);
}

/** Hasz SHA-256 (hex) tokenu – w bazie trzymamy tylko to. */
export function hashMagicToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function magicLinkExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + MAGIC_LINK_TTL_MINUTES * 60_000);
}

/** Link nadaje się do użycia: niewykorzystany i nieprzeterminowany. */
export function isMagicLinkUsable(link: { expiresAt: Date; usedAt: Date | null }, now: Date = new Date()): boolean {
  return link.usedAt === null && link.expiresAt.getTime() > now.getTime();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Wysyła link, jeśli pod adresem są zamówienia lub kody pakietów. Zwraca, czy wysłano – wynik
 * NIE może trafić do odpowiedzi HTTP (nie ujawniamy, czy adres jest w bazie).
 */
export async function requestMagicLink(rawEmail: string, now: Date = new Date()): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const [orders, codes] = await Promise.all([
    prisma.order.count({ where: { email } }),
    prisma.packageCode.count({ where: { email } }),
  ]);
  if (orders === 0 && codes === 0) return false;

  const token = generateMagicToken();
  await prisma.magicLink.deleteMany({ where: { email, expiresAt: { lt: now } } });
  await prisma.magicLink.create({
    data: { email, tokenHash: hashMagicToken(token), expiresAt: magicLinkExpiry(now) },
  });
  const result = await sendEmail(
    magicLinkEmail({ email, url: absoluteUrl(myOrdersLinkPath(token)), validMinutes: MAGIC_LINK_TTL_MINUTES }),
  );
  if (!result.ok) console.error("[magic-link] Nie wysłano linku:", result.error);
  return result.ok;
}

/** Sprawdza link BEZ zużywania (do wyświetlenia strony potwierdzenia). */
export async function isMagicLinkValid(token: string, now: Date = new Date()): Promise<boolean> {
  if (!isMagicTokenFormat(token)) return false;
  const link = await prisma.magicLink.findUnique({
    where: { tokenHash: hashMagicToken(token) },
    select: { expiresAt: true, usedAt: true },
  });
  return link !== null && isMagicLinkUsable(link, now);
}

/**
 * Zużywa link atomowo (jednorazowość także przy równoległych kliknięciach).
 * Zwraca e-mail właściciela albo null (zły, zużyty lub przeterminowany token).
 */
export async function consumeMagicLink(token: string, now: Date = new Date()): Promise<string | null> {
  if (!isMagicTokenFormat(token)) return null;
  const tokenHash = hashMagicToken(token);
  const updated = await prisma.magicLink.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (updated.count !== 1) return null;
  const link = await prisma.magicLink.findUnique({ where: { tokenHash }, select: { email: true } });
  return link?.email ?? null;
}

// --- sesja klienta ----------------------------------------------------------------

/** Wartość ciasteczka: `<email base64url>.<wygaśnięcie ms>.<HMAC>`. */
export function createClientSessionValue(email: string, now: number = Date.now()): string {
  const encoded = Buffer.from(normalizeEmail(email)).toString("base64url");
  const expires = now + CLIENT_SESSION_HOURS * 3_600_000;
  const payload = `${encoded}.${expires}`;
  return `${payload}.${sign(SESSION_CONTEXT, payload)}`;
}

/** E-mail z poprawnej, ważnej sesji albo null. */
export function verifyClientSessionValue(value: string | undefined | null, now: number = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [encoded, expires, signature] = parts;
  if (!encoded || !signature || !/^\d+$/.test(expires ?? "")) return null;
  if (Number(expires) < now) return null;
  try {
    if (!safeEqual(sign(SESSION_CONTEXT, `${encoded}.${expires}`), signature)) return null;
  } catch (error) {
    if (error instanceof MissingSecretError) return null;
    throw error;
  }
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  return email.includes("@") ? email : null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getSiteUrl().startsWith("https://"),
    path: "/",
    maxAge,
  };
}

/** Ustawia sesję klienta (tylko server action / route handler). */
export async function startClientSession(email: string): Promise<void> {
  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, createClientSessionValue(email), cookieOptions(CLIENT_SESSION_HOURS * 3600));
}

export async function endClientSession(): Promise<void> {
  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, "", cookieOptions(0));
}

/** E-mail zalogowanego klienta (strona / server action) albo null. */
export async function getClientSessionEmail(): Promise<string | null> {
  const store = await cookies();
  return verifyClientSessionValue(store.get(CLIENT_SESSION_COOKIE)?.value);
}
