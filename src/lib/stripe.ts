import Stripe from "stripe";
import { formatPLN, formatPhotoCount } from "@/lib/format";
import { CURRENCY, getAddon } from "@/lib/pricing";
import type { PriceBreakdown } from "@/lib/pricing";
import { ROUTES, SITE, absoluteUrl } from "@/lib/site";
import { getStyleName } from "@/lib/styles";

/**
 * Stripe inicjalizowany leniwie – brak STRIPE_SECRET_KEY nie psuje buildu,
 * a API zwraca wtedy czytelny błąd 503.
 */

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super("Płatności nie są jeszcze skonfigurowane. Spróbuj później lub skontaktuj się z nami.");
    this.name = "PaymentsNotConfiguredError";
  }
}

let client: Stripe | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new PaymentsNotConfiguredError();
  if (!client) {
    client = new Stripe(key, { appInfo: { name: SITE.name } });
  }
  return client;
}

/**
 * Metody płatności w Checkout (BLIK i P24 potwierdzają się asynchronicznie).
 * Stripe SDK v23 nie ma już `payment_method_types` w parametrach sesji – używamy
 * `allowed_payment_method_types` (filtr na metody włączone w Dashboardzie Stripe:
 * Ustawienia → Metody płatności → BLIK, Przelewy24, karty muszą być aktywne).
 */
export const PAYMENT_METHOD_TYPES = ["blik", "card", "p24"] as const;

/** Opis rozbicia ceny do pozycji w Stripe (Stripe nie przyjmuje ujemnych pozycji). */
export function describeBreakdown(breakdown: PriceBreakdown, style: string): string {
  const parts = [
    `Styl: ${getStyleName(style)}`,
    `Zdjęcia: ${breakdown.photoCount} × ${formatPLN(breakdown.unitPrice)} = ${formatPLN(breakdown.base)}`,
  ];
  if (breakdown.addons > 0) {
    const names = breakdown.addonSlugs.map((slug) => getAddon(slug).name).join(", ");
    parts.push(`Dodatki (${names}): ${formatPLN(breakdown.addons)}`);
  }
  if (breakdown.express > 0) parts.push(`Ekspres: ${formatPLN(breakdown.express)}`);
  if (breakdown.discount > 0) {
    parts.push(`Kredyty z pakietu (${breakdown.creditsUsed}): −${formatPLN(breakdown.discount)}`);
  }
  return parts.join(" · ").slice(0, 500);
}

export interface CheckoutOrder {
  id: string;
  number: string;
  publicToken: string;
  email: string;
  style: string;
  nip?: string | null;
  breakdown: PriceBreakdown;
}

export async function createCheckoutSession(
  order: CheckoutOrder,
): Promise<{ id: string; url: string }> {
  const stripe = getStripe();
  const { breakdown } = order;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allowed_payment_method_types: [...PAYMENT_METHOD_TYPES],
    currency: CURRENCY,
    locale: "pl",
    customer_email: order.email,
    client_reference_id: order.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: breakdown.total,
          product_data: {
            name: `Wirtualny home staging – ${formatPhotoCount(breakdown.photoCount)}`,
            description: describeBreakdown(breakdown, order.style),
          },
        },
      },
    ],
    metadata: { orderId: order.id, orderNumber: order.number, nip: order.nip ?? "" },
    payment_intent_data: {
      description: `Zamówienie ${order.number}`,
      metadata: { orderId: order.id, orderNumber: order.number },
    },
    success_url: absoluteUrl(`${ROUTES.orderStatus(order.publicToken)}?platnosc=ok`),
    cancel_url: absoluteUrl(`${ROUTES.order}?anulowano=1&zamowienie=${order.publicToken}`),
  });
  if (!session.url) throw new Error("Stripe nie zwrócił adresu płatności.");
  return { id: session.id, url: session.url };
}

/**
 * Wygasza otwartą sesję Checkout (best effort). Sesji już zakończonej (opłaconej lub wygasłej)
 * Stripe nie pozwala wygasić – wtedy tylko logujemy.
 */
export async function expireCheckoutSession(sessionId: string): Promise<boolean> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.status !== "open") return false;
    await getStripe().checkout.sessions.expire(sessionId);
    return true;
  } catch (error) {
    console.warn(`[stripe] Nie udało się wygasić sesji ${sessionId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}
