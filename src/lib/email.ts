import { formatDateTimePL, formatPLN, formatPhotoCount } from "@/lib/format";
import { INCLUDED_REVISIONS, REVISION_WINDOW_DAYS, getAddon } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { ROUTES, SITE, absoluteUrl } from "@/lib/site";
import { getStyleName } from "@/lib/styles";

/**
 * Wysyłka e-maili przez Resend. Bez RESEND_API_KEY treść trafia do console.info
 * (lokalnie i w buildzie nic się nie wysypuje). Funkcje NIE rzucają wyjątków.
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  logged?: boolean;
  error?: string;
}

function getFrom(): string {
  return process.env.EMAIL_FROM?.trim() || `${SITE.name} <${SITE.email}>`;
}

/** Adres operatora dla powiadomień o nowych zamówieniach. */
export function getAdminEmail(): string {
  return process.env.EMAIL_ADMIN?.trim() || SITE.email;
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(
      `[email] (brak RESEND_API_KEY – nie wysłano)\nDo: ${[message.to].flat().join(", ")}\nTemat: ${message.subject}\n\n${message.text}\n`,
    );
    return { ok: true, logged: true };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: getFrom(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo ?? SITE.email,
    });
    if (error) {
      console.error("[email] Błąd Resend:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[email] Wyjątek przy wysyłce:", msg);
    return { ok: false, error: msg };
  }
}

// --- szablony -------------------------------------------------------------------

export interface EmailOrder {
  number: string;
  publicToken: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  photoCount: number;
  style: string;
  addons: readonly AddonSlug[];
  express: boolean;
  totalAmount: number;
  deadline: Date;
  isSample: boolean;
  notes?: string | null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,Arial,sans-serif;color:#1c1c1e;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e1d8;border-radius:16px;">
<tr><td style="padding:24px 28px 8px;font-size:18px;font-weight:700;color:#1f4d3a;">${escapeHtml(SITE.name)}</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
</table>
<p style="font-size:12px;color:#5c5a57;margin:16px 0 0;">${escapeHtml(SITE.name)} · ${escapeHtml(SITE.email)} · ${escapeHtml(SITE.domain)}</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#1f4d3a;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">${escapeHtml(label)}</a></p>`;
}

function rows(items: ReadonlyArray<readonly [string, string]>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#5c5a57;width:45%;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function summaryRows(order: EmailOrder): Array<readonly [string, string]> {
  const items: Array<readonly [string, string]> = [
    ["Numer zamówienia", order.number],
    ["Liczba zdjęć", formatPhotoCount(order.photoCount)],
    ["Styl", getStyleName(order.style)],
  ];
  if (order.addons.length > 0) {
    items.push(["Dodatki", order.addons.map((slug) => getAddon(slug).name).join(", ")]);
  }
  if (order.express) items.push(["Realizacja", `Ekspres (do ${SITE.expressHours} h)`]);
  items.push(["Kwota", order.isSample ? "Gratis (darmowa próbka)" : formatPLN(order.totalAmount)]);
  items.push(["Planowany termin", formatDateTimePL(order.deadline)]);
  return items;
}

function textRows(items: ReadonlyArray<readonly [string, string]>): string {
  return items.map(([k, v]) => `${k}: ${v}`).join("\n");
}

export function orderConfirmationEmail(order: EmailOrder): EmailMessage {
  const statusUrl = absoluteUrl(ROUTES.orderStatus(order.publicToken));
  const greeting = order.name ? `Dzień dobry, ${order.name}!` : "Dzień dobry!";
  const intro = order.isSample
    ? "Dziękujemy za zgłoszenie darmowej próbki. Przyjęliśmy Twoje zdjęcie – gotową wizualizację prześlemy zwykle w ciągu 24–48 godzin."
    : "Dziękujemy – przyjęliśmy Twoje zamówienie i płatność. Zabieramy się do pracy.";
  const items = summaryRows(order);
  const subject = order.isSample
    ? `Przyjęliśmy zgłoszenie darmowej próbki ${order.number}`
    : `Przyjęliśmy zamówienie ${order.number}`;
  const html = layout(
    subject,
    `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>${rows(items)}
<p>Status zamówienia i gotowe pliki znajdziesz zawsze pod tym linkiem:</p>${button(statusUrl, "Sprawdź status zamówienia")}
<p style="color:#5c5a57;font-size:13px;">Każda wizualizacja jest oznaczona napisem „wizualizacja”. W cenie masz ${INCLUDED_REVISIONS} bezpłatną poprawkę do ${REVISION_WINDOW_DAYS} dni od dostarczenia.</p>`,
  );
  const text = `${greeting}

${intro}

${textRows(items)}

Status zamówienia: ${statusUrl}

Każda wizualizacja jest oznaczona napisem „wizualizacja”. W cenie masz ${INCLUDED_REVISIONS} bezpłatną poprawkę do ${REVISION_WINDOW_DAYS} dni od dostarczenia.

${SITE.name}
${SITE.email}`;
  return { to: order.email, subject, html, text };
}

export function orderReadyEmail(order: EmailOrder): EmailMessage {
  const statusUrl = absoluteUrl(ROUTES.orderStatus(order.publicToken));
  const greeting = order.name ? `Dzień dobry, ${order.name}!` : "Dzień dobry!";
  const subject = `Twoje wizualizacje są gotowe – ${order.number}`;
  const html = layout(
    subject,
    `<p>${escapeHtml(greeting)}</p><p>Twoje wizualizacje (${escapeHtml(formatPhotoCount(order.photoCount))}) są gotowe do pobrania. Możesz pobrać je pojedynczo albo wszystkie naraz w pliku ZIP.</p>
${button(statusUrl, "Pobierz wizualizacje")}
<p>Coś wymaga zmiany? W cenie masz ${INCLUDED_REVISIONS} bezpłatną poprawkę – zgłoś ją w ciągu ${REVISION_WINDOW_DAYS} dni, odpowiadając na tę wiadomość lub przyciskiem na stronie zamówienia.</p>
<p style="color:#5c5a57;font-size:13px;">Pamiętaj: publikując wizualizację, pokaż również zdjęcie oryginalne lub wyraźnie oznacz, że to wizualizacja. Pliki przechowujemy przez 30 dni.</p>`,
  );
  const text = `${greeting}

Twoje wizualizacje (${formatPhotoCount(order.photoCount)}) są gotowe do pobrania:
${statusUrl}

Coś wymaga zmiany? W cenie masz ${INCLUDED_REVISIONS} bezpłatną poprawkę – zgłoś ją w ciągu ${REVISION_WINDOW_DAYS} dni.

Pamiętaj: publikując wizualizację, pokaż również zdjęcie oryginalne lub wyraźnie oznacz, że to wizualizacja. Pliki przechowujemy przez 30 dni.

${SITE.name}
${SITE.email}`;
  return { to: order.email, subject, html, text };
}

export function adminNewOrderEmail(order: EmailOrder, adminUrl: string): EmailMessage {
  const items: Array<readonly [string, string]> = [
    ...summaryRows(order),
    ["Klient", [order.name, order.company].filter(Boolean).join(", ") || "—"],
    ["E-mail", order.email],
    ["Telefon", order.phone || "—"],
  ];
  if (order.notes) items.push(["Uwagi", order.notes]);
  const subject = `${order.isSample ? "Nowa darmowa próbka" : "Nowe zamówienie"} ${order.number} – ${formatPhotoCount(order.photoCount)}${order.express ? " (EKSPRES)" : ""}`;
  const html = layout(subject, `<p><strong>${escapeHtml(subject)}</strong></p>${rows(items)}${button(adminUrl, "Otwórz w panelu")}`);
  const text = `${subject}

${textRows(items)}

Panel: ${adminUrl}`;
  return { to: getAdminEmail(), subject, html, text };
}
