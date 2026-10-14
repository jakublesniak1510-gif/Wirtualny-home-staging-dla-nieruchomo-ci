import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MissingSecretError, safeEqual, sign } from "@/lib/secrets";
import { getSiteUrl } from "@/lib/site";

/**
 * Sesja administratora: ciasteczko HttpOnly `<wygaśnięcie>.<HMAC>` ważne 7 dni,
 * podpisane ADMIN_SESSION_SECRET. Hasło porównywane z ADMIN_PASSWORD w czasie stałym.
 */

export const ADMIN_COOKIE = "ws_admin";
export const ADMIN_SESSION_DAYS = 7;
const SESSION_CONTEXT = "admin-session";

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

/** Porównanie hasła odporne na ataki czasowe (skróty SHA-256 o stałej długości). */
export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createSessionValue(now: number = Date.now()): string {
  const expires = now + ADMIN_SESSION_DAYS * 24 * 3_600_000;
  return `${expires}.${sign(SESSION_CONTEXT, String(expires))}`;
}

export function verifySessionValue(value: string | undefined | null, now: number = Date.now()): boolean {
  if (!value) return false;
  const [expires, signature, ...rest] = value.split(".");
  if (!expires || !signature || rest.length > 0 || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < now) return false;
  try {
    return safeEqual(sign(SESSION_CONTEXT, expires), signature);
  } catch (error) {
    if (error instanceof MissingSecretError) return false;
    throw error;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getSiteUrl().startsWith("https://"),
    path: "/",
    maxAge: ADMIN_SESSION_DAYS * 24 * 3600,
  };
}

/** Ustawia ciasteczko sesji (server action / route handler). */
export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionValue(), cookieOptions());
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

/** Czy bieżące żądanie (strona / server action / route handler) ma ważną sesję admina. */
export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(ADMIN_COOKIE)?.value);
}

/** Dla stron panelu: przekierowuje na logowanie, gdy brak sesji. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminSession())) redirect("/admin/login");
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rawValue.join("="));
  }
  return undefined;
}

/** Dla tras API: sprawdza ciasteczko z nagłówka żądania. */
export function isAdminRequest(request: Request): boolean {
  return verifySessionValue(readCookie(request.headers.get("cookie"), ADMIN_COOKIE));
}

export function adminUnauthorized(): Response {
  return Response.json({ error: "Brak dostępu – zaloguj się do panelu." }, { status: 401 });
}
