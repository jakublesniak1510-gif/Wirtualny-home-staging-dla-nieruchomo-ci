import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { cancelOrder, markOrderPaid } from "@/lib/order-service";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function findOrderId(session: Stripe.Checkout.Session): Promise<string | null> {
  const fromMetadata = session.metadata?.orderId ?? session.client_reference_id;
  if (fromMetadata) return fromMetadata;
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  return order?.id ?? null;
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

/**
 * POST /api/webhooks/stripe – zdarzenia Stripe Checkout (podpis STRIPE_WEBHOOK_SECRET).
 * BLIK i Przelewy24 bywają asynchroniczne: `completed` może przyjść z payment_status
 * „unpaid”, a potwierdzenie dopiero w `async_payment_succeeded`.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !isStripeConfigured()) {
    return Response.json({ error: "Płatności nie są jeszcze skonfigurowane." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Brak podpisu Stripe." }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.warn("[stripe] Niepoprawny podpis webhooka:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Niepoprawny podpis." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
          break; // płatność asynchroniczna w toku – czekamy na async_payment_succeeded
        }
        const orderId = await findOrderId(session);
        if (!orderId) {
          console.warn(`[stripe] Brak zamówienia dla sesji ${session.id}`);
          break;
        }
        await markOrderPaid(orderId, { paymentIntentId: paymentIntentId(session), sessionId: session.id });
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = await findOrderId(session);
        if (orderId) await cancelOrder(orderId, { onlyIfUnpaid: true, sessionId: session.id });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe] Błąd obsługi zdarzenia ${event.type}:`, error);
    // 500 → Stripe ponowi dostarczenie (obsługa jest idempotentna).
    return Response.json({ error: "Błąd obsługi zdarzenia." }, { status: 500 });
  }

  return Response.json({ received: true });
}
