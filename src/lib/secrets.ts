import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Sekret aplikacji do podpisów HMAC (ciasteczko admina, linki do plików tymczasowych).
 * Produkcyjnie WYMAGANY (`ADMIN_SESSION_SECRET`, min. 32 znaki). W trybie deweloperskim,
 * gdy brak zmiennej, używamy losowego sekretu na czas życia procesu (z ostrzeżeniem).
 */
let devSecret: string | undefined;

export class MissingSecretError extends Error {
  constructor() {
    super("Brak ADMIN_SESSION_SECRET (min. 32 znaki) – ustaw zmienną środowiskową.");
    this.name = "MissingSecretError";
  }
}

export function getAppSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === "production") throw new MissingSecretError();
  if (!devSecret) {
    devSecret = randomBytes(32).toString("hex");
    console.warn(
      "[secrets] Brak ADMIN_SESSION_SECRET (min. 32 znaki) – używam losowego sekretu tylko dla tego procesu.",
    );
  }
  return devSecret;
}

/** HMAC-SHA256 (base64url) z kontekstem, żeby podpisy różnych typów nie były wymienne. */
export function sign(context: string, value: string): string {
  return createHmac("sha256", getAppSecret()).update(`${context}:${value}`).digest("base64url");
}

/** Porównanie odporne na ataki czasowe (różne długości → false). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifySignature(context: string, value: string, signature: string): boolean {
  return safeEqual(sign(context, value), signature);
}
