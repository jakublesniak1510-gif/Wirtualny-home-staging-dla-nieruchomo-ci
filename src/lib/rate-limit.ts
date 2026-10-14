/**
 * Prosty limiter zapytań w pamięci procesu (okno stałe). Wystarcza dla jednej instancji
 * serwera; przy wielu instancjach zastąp np. Redisem/Upstash.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Sekundy do zresetowania okna (dla nagłówka Retry-After). */
  retryAfter: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, options: RateLimitOptions, now = Date.now()): RateLimitResult {
  sweep(now);
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  if (bucket.count > options.limit) {
    return { ok: false, remaining: 0, retryAfter };
  }
  return { ok: true, remaining: options.limit - bucket.count, retryAfter };
}

/** Tylko do testów. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** IP klienta z nagłówków proxy (pierwszy adres z X-Forwarded-For). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Gotowe limity dla tras API. */
export const LIMITS = {
  upload: { limit: 60, windowMs: 10 * 60_000 },
  orders: { limit: 20, windowMs: 10 * 60_000 },
  codeValidate: { limit: 30, windowMs: 10 * 60_000 },
  login: { limit: 10, windowMs: 10 * 60_000 },
  /** Wszystkie próby logowania do panelu łącznie (niezależnie od IP). */
  loginGlobal: { limit: 50, windowMs: 10 * 60_000 },
  sample: { limit: 5, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitOptions>;

/** Sprawdza limit i zwraca gotową odpowiedź 429 (albo null, gdy można kontynuować). */
export function checkRateLimit(
  scope: keyof typeof LIMITS,
  headers: Headers,
): Response | null {
  const result = rateLimit(`${scope}:${getClientIp(headers)}`, LIMITS[scope]);
  if (result.ok) return null;
  return Response.json(
    { error: "Zbyt wiele prób w krótkim czasie. Odczekaj chwilę i spróbuj ponownie." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
  );
}
