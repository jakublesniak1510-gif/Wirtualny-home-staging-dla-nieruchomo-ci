import { escapeHtml, sendEmail } from "@/lib/email";
import type { EmailMessage, EmailResult } from "@/lib/email";
import { formatPhotoCount } from "@/lib/format";
import { ROUTES, SITE, absoluteUrl } from "@/lib/site";

/**
 * Proste e-maile wysyłane z panelu (do przeniesienia do src/lib/email.ts przy scalaniu –
 * tam jest wspólny layout szablonów).
 */

function simpleLayout(title: string, body: string): string {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#faf8f5;font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,Arial,sans-serif;color:#1c1c1e;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e1d8;border-radius:16px;padding:24px 28px;font-size:15px;line-height:1.6;">
<p style="font-size:18px;font-weight:700;color:#1f4d3a;margin:0 0 12px;">${escapeHtml(SITE.name)}</p>${body}</div>
<p style="font-size:12px;color:#5c5a57;text-align:center;margin:16px 0 0;">${escapeHtml(SITE.name)} · ${escapeHtml(SITE.email)}</p>
</body></html>`;
}

export function referralRewardEmail(input: { to: string; code: string; photos: number; referredOrders: number }): EmailMessage {
  const orderUrl = absoluteUrl(ROUTES.order);
  const subject = `Dziękujemy za polecenie – ${formatPhotoCount(input.photos)} gratis`;
  const intro = `Osoby, którym polecono ${SITE.name}, złożyły już opłacone zamówienia (${input.referredOrders}). W podziękowaniu przygotowaliśmy dla Ciebie kod na ${formatPhotoCount(input.photos)} gratis.`;
  const html = simpleLayout(
    subject,
    `<p>Dzień dobry!</p><p>${escapeHtml(intro)}</p>
<p style="font-size:22px;font-weight:700;letter-spacing:1px;font-family:ui-monospace,monospace;background:#f3eee6;border-radius:12px;padding:12px 16px;display:inline-block;">${escapeHtml(input.code)}</p>
<p>Wpisz go w polu „Kod pakietu” w kreatorze zamówienia: <a href="${escapeHtml(orderUrl)}" style="color:#1f4d3a;">${escapeHtml(orderUrl)}</a>. 1 kredyt = 1 zdjęcie (dodatki płatne osobno).</p>
<p>Dziękujemy, że polecasz nas dalej!</p>`,
  );
  const text = `Dzień dobry!

${intro}

Twój kod: ${input.code}

Wpisz go w polu „Kod pakietu” w kreatorze zamówienia: ${orderUrl}
1 kredyt = 1 zdjęcie (dodatki płatne osobno).

Dziękujemy, że polecasz nas dalej!
${SITE.name}
${SITE.email}`;
  return { to: input.to, subject, html, text };
}

export async function sendReferralRewardEmail(input: Parameters<typeof referralRewardEmail>[0]): Promise<EmailResult> {
  return sendEmail(referralRewardEmail(input));
}
