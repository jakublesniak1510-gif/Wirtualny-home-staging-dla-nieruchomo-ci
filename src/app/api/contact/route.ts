import { NextResponse } from "next/server";
import { CONTACT_CONSENT_TEXT } from "@/content/legal";
import { OFFICE_LISTINGS_OPTIONS } from "@/content/service";
import { checkContactRateLimit, getClientIp } from "@/lib/contact-rate-limit";
import { contactRequestSchema } from "@/lib/contact-schema";
import type { ContactApiResponse } from "@/lib/contact-shared";
import { prisma } from "@/lib/db";
import { escapeHtml, getAdminEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Maksymalny rozmiar treści żądania (bajty) – formularz to kilka pól tekstowych. */
const MAX_BODY_BYTES = 32 * 1024;

function json(body: ContactApiResponse, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== "object" || body === null || !("website" in body)) return false;
  const value = (body as { website: unknown }).website;
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * POST /api/contact – formularz kontaktowy (`type: "contact"`) i zapytanie o abonament
 * dla biur (`type: "office"`). Zapisuje zgłoszenie w tabeli ContactRequest.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = checkContactRateLimit(ip);
  if (!limit.allowed) {
    return json(
      {
        ok: false,
        error: "Wysłano zbyt wiele wiadomości. Spróbuj ponownie za kilka minut albo napisz do nas e-mailem.",
      },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Wiadomość jest za długa." }, 413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: "Nie udało się odczytać formularza." }, 400);
  }
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Wiadomość jest za długa." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Niepoprawny format danych." }, 400);
  }

  // Honeypot: bot wypełnił ukryte pole „website” – udajemy sukces, nic nie zapisujemy.
  if (isHoneypotFilled(body)) {
    return json({ ok: true });
  }

  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json({ ok: false, error: "Popraw zaznaczone pola formularza.", fieldErrors }, 400);
  }

  const data = parsed.data;

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
  const consentMeta = { consent: true, consentText: CONTACT_CONSENT_TEXT, consentAt: new Date().toISOString() };

  try {
    if (data.type === "office") {
      const listings = OFFICE_LISTINGS_OPTIONS.find((option) => option.value === data.listingsPerMonth);
      await prisma.contactRequest.create({
        data: {
          type: data.type,
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          company: data.company,
          message: data.message ?? null,
          payload: JSON.stringify({
            listingsPerMonth: data.listingsPerMonth,
            listingsPerMonthLabel: listings?.label ?? data.listingsPerMonth,
            ...consentMeta,
            userAgent,
          }),
        },
      });
    } else {
      await prisma.contactRequest.create({
        data: {
          type: data.type,
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          message: data.message,
          payload: JSON.stringify({ ...consentMeta, userAgent }),
        },
      });
    }
  } catch (error) {
    console.error("[api/contact] Nie udało się zapisać zgłoszenia", error);
    return json(
      { ok: false, error: "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz do nas e-mailem." },
      500,
    );
  }

  // Powiadomienie operatora. Zgłoszenie jest już zapisane, więc błąd wysyłki nie wraca do klienta.
  const typeLabel = data.type === "office" ? "Zapytanie od biura (abonament)" : "Wiadomość z formularza kontaktowego";
  const lines: Array<[string, string]> = [
    ["Typ", typeLabel],
    ["Imię i nazwisko", data.name],
    ["E-mail", data.email],
    ["Telefon", data.phone ?? "—"],
  ];
  if (data.type === "office") {
    const listings = OFFICE_LISTINGS_OPTIONS.find((option) => option.value === data.listingsPerMonth);
    lines.push(["Biuro", data.company], ["Liczba ofert / mies.", listings?.label ?? data.listingsPerMonth]);
  }
  lines.push(["Wiadomość", data.message ?? "—"]);
  const text = lines.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `<h2>${escapeHtml(typeLabel)}</h2><table>${lines
    .map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;
  void sendEmail({
    to: getAdminEmail(),
    subject: `[Strona] ${typeLabel}: ${data.name}`,
    text,
    html,
    replyTo: data.email,
  }).catch((error: unknown) => console.error("[api/contact] Nie udało się wysłać powiadomienia", error));

  return json({ ok: true });
}
