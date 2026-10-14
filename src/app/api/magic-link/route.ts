import { after } from "next/server";
import { z } from "zod";
import { readJson, validationError } from "@/lib/api";
import { normalizeEmail, requestMagicLink } from "@/lib/magic-link";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ email: emailSchema });

/** 5 próśb / 15 min na parę IP + e-mail oraz 20 / 15 min na samo IP (przeciw masowemu sprawdzaniu adresów). */
const PER_EMAIL = { limit: 5, windowMs: 15 * 60_000 };
const PER_IP = { limit: 20, windowMs: 15 * 60_000 };
/**
 * Limit wysyłek na sam adres (niezależnie od IP) – chroni skrzynkę ofiary przed zasypaniem linkami
 * z wielu adresów IP. Po przekroczeniu NIE zwracamy 429 (to zdradzałoby cudzy ruch), tylko po cichu
 * nie wysyłamy kolejnego e-maila.
 */
const PER_EMAIL_GLOBAL = { limit: 5, windowMs: 60 * 60_000 };

const GENERIC_MESSAGE =
  "Jeśli mamy zamówienia na ten adres, wysłaliśmy link logowania. Sprawdź skrzynkę (również folder Spam) – link działa 30 minut.";

/**
 * POST /api/magic-link { email } – prośba o link do „Moje zamówienia”.
 * Odpowiedź zawsze taka sama (nie ujawniamy, czy adres jest w bazie); wyszukiwanie i wysyłka
 * dzieją się po wysłaniu odpowiedzi (`after`), więc czas odpowiedzi też niczego nie zdradza.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const email = normalizeEmail(parsed.data.email);
  const ip = getClientIp(request.headers);
  const byIp = rateLimit(`magic-ip:${ip}`, PER_IP);
  const byEmail = rateLimit(`magic:${ip}:${email}`, PER_EMAIL);
  if (!byIp.ok || !byEmail.ok) {
    return Response.json(
      { error: "Zbyt wiele prób w krótkim czasie. Odczekaj kilkanaście minut i spróbuj ponownie." },
      { status: 429, headers: { "Retry-After": String(Math.max(byIp.retryAfter, byEmail.retryAfter)) } },
    );
  }
  if (!rateLimit(`magic-email:${email}`, PER_EMAIL_GLOBAL).ok) {
    return Response.json({ ok: true, message: GENERIC_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
  }
  after(async () => {
    try {
      await requestMagicLink(email);
    } catch (error) {
      console.error("[magic-link] Błąd wysyłki linku:", error);
    }
  });
  return Response.json({ ok: true, message: GENERIC_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
}
