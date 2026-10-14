/**
 * Prosty limiter zapytań w pamięci procesu (okno przesuwne) – tylko dla /api/contact.
 * Wystarczy na jeden serwer / jedną instancję. Przy wielu instancjach (serverless)
 * limit liczy się osobno w każdej z nich – to akceptowalne dla formularza kontaktowego.
 */

export const CONTACT_RATE_LIMIT = {
  /** Maksymalna liczba zgłoszeń z jednego IP w oknie. */
  max: 10,
  /** Długość okna w milisekundach (10 minut). */
  windowMs: 10 * 60 * 1000,
} as const;

const MAX_TRACKED_KEYS = 5000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Ile zgłoszeń zostało w bieżącym oknie. */
  remaining: number;
  /** Po ilu sekundach można spróbować ponownie (gdy allowed = false). */
  retryAfterSeconds: number;
}

function prune(now: number) {
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < CONTACT_RATE_LIMIT.windowMs);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

/** Rejestruje próbę dla klucza (np. IP) i zwraca, czy mieści się w limicie. */
export function checkContactRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  if (hits.size > MAX_TRACKED_KEYS) prune(now);

  const recent = (hits.get(key) ?? []).filter((t) => now - t < CONTACT_RATE_LIMIT.windowMs);

  if (recent.length >= CONTACT_RATE_LIMIT.max) {
    hits.set(key, recent);
    const oldest = recent[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + CONTACT_RATE_LIMIT.windowMs - now) / 1000)),
    };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, remaining: CONTACT_RATE_LIMIT.max - recent.length, retryAfterSeconds: 0 };
}

/** Tylko do testów. */
export function resetContactRateLimit() {
  hits.clear();
}

/** IP klienta z nagłówków proxy (Vercel/Railway/nginx ustawiają x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
