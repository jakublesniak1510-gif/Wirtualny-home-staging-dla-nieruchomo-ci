import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MissingSecretError, safeEqual, sign } from "@/lib/secrets";
import { getSiteUrl } from "@/lib/site";

/**
 * Sesja administratora: ciasteczko HttpOnly, SameSite=Lax, `<wygaśnięcie>.<HMAC>` ważne 7 dni,
 * podpisane ADMIN_SESSION_SECRET. Hasło porównywane z ADMIN_PASSWORD w czasie stałym.
 * Sesja jest odnawiana (przesuwane okno), gdy zostało mniej niż połowa ważności –
 * panel wywołuje POST /api/admin/session przy wejściu na stronę.
 * Trasy /api/admin/** dla metod zmieniających dane sprawdzają nagłówek Origin (ochrona CSRF).
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

/** Pozostały czas ważności sesji w ms (0 – nieważna). */
export function sessionRemainingMs(value: string | undefined | null, now: number = Date.now()): number {
  if (!verifySessionValue(value, now) || !value) return 0;
  return Number(value.split(".")[0]) - now;
}

/** Odnawiamy, gdy minęła ponad połowa ważności. */
export function shouldRenewSession(value: string | undefined | null, now: number = Date.now()): boolean {
  const remaining = sessionRemainingMs(value, now);
  return remaining > 0 && remaining < (ADMIN_SESSION_DAYS * 24 * 3_600_000) / 2;
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

/** Odnawia ciasteczko sesji, jeśli trzeba (tylko route handler / server action). Zwraca true przy odnowieniu. */
export async function renewAdminSessionIfNeeded(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!shouldRenewSession(value)) return false;
  store.set(ADMIN_COOKIE, createSessionValue(), cookieOptions());
  return true;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Ochrona CSRF dla metod zmieniających dane: żądanie z przeglądarki musi pochodzić z tej samej
 * domeny (nagłówek Origin = host żądania lub NEXT_PUBLIC_SITE_URL; Sec-Fetch-Site nie „cross-site”).
 * Brak Origin (np. curl, skrypt na serwerze) jest dopuszczony – przeglądarki zawsze go wysyłają
 * przy żądaniach POST/PATCH/DELETE z innej domeny.
 */
export function isSameOriginRequest(request: Request): boolean {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) return true;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const originHost = hostOf(origin);
  if (!originHost) return false;
  const allowed = new Set<string>();
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) allowed.add(forwarded);
  const host = request.headers.get("host")?.trim();
  if (host) allowed.add(host);
  const requestHost = hostOf(request.url);
  if (requestHost) allowed.add(requestHost);
  const siteHost = hostOf(getSiteUrl());
  if (siteHost) allowed.add(siteHost);
  return allowed.has(originHost);
}

/** Dla tras API: ważna sesja z ciasteczka + (dla metod zmieniających) zgodny Origin. */
export function isAdminRequest(request: Request): boolean {
  return verifySessionValue(readCookie(request.headers.get("cookie"), ADMIN_COOKIE)) && isSameOriginRequest(request);
}

export function adminUnauthorized(): Response {
  return Response.json({ error: "Brak dostępu – zaloguj się do panelu." }, { status: 401 });
}

/**
 * Strażnik tras /api/admin/**: null = OK, inaczej gotowa odpowiedź 401 (brak sesji)
 * lub 403 (żądanie z obcej domeny – CSRF).
 */
export function adminGuard(request: Request): Response | null {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Odrzucono żądanie z innej domeny." }, { status: 403 });
  }
  if (!verifySessionValue(readCookie(request.headers.get("cookie"), ADMIN_COOKIE))) return adminUnauthorized();
  return null;
}
