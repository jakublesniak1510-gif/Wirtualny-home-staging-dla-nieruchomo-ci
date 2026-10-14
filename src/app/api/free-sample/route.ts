import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { createSampleOrder } from "@/lib/order-service";
import { getOrderNumber } from "@/lib/orders";
import { checkRateLimit } from "@/lib/rate-limit";
import { ROUTES } from "@/lib/site";
import { sampleInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/free-sample – darmowa próbka (1 zdjęcie, 1 na adres e-mail). Odp.: { orderNumber, publicToken, url }. */
export async function POST(request: Request) {
  const limited = checkRateLimit("sample", request.headers);
  if (limited) return limited;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane formularza.");
  const parsed = sampleInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const order = await createSampleOrder(parsed.data);
    return Response.json(
      {
        orderNumber: getOrderNumber(order.id),
        publicToken: order.publicToken,
        url: ROUTES.orderStatus(order.publicToken),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error, "Darmowa próbka");
  }
}
