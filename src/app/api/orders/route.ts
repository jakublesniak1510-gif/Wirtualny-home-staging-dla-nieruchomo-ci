import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { createOrder } from "@/lib/order-service";
import { getOrderNumber } from "@/lib/orders";
import { checkRateLimit } from "@/lib/rate-limit";
import { ROUTES } from "@/lib/site";
import { orderInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/orders – tworzy zamówienie z wgranych plików tymczasowych.
 * Odpowiedź: { orderNumber, publicToken, total, url } – `url` to Stripe Checkout
 * albo (gdy do zapłaty 0 zł) strona statusu zamówienia.
 */
export async function POST(request: Request) {
  const limited = checkRateLimit("orders", request.headers);
  if (limited) return limited;

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane zamówienia.");
  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { order, breakdown, checkoutUrl } = await createOrder(parsed.data);
    return Response.json(
      {
        orderNumber: getOrderNumber(order.id),
        publicToken: order.publicToken,
        total: breakdown.total,
        url: checkoutUrl ?? ROUTES.orderStatus(order.publicToken),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error, "Tworzenie zamówienia");
  }
}
