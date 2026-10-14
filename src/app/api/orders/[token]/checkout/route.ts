import { handleRouteError } from "@/lib/api";
import { retryCheckout } from "@/lib/order-service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/orders/<token>/checkout – nowa sesja płatności dla nieopłaconego zamówienia. Odp.: { url }. */
export async function POST(request: Request, ctx: RouteContext<"/api/orders/[token]/checkout">) {
  const limited = checkRateLimit("orders", request.headers);
  if (limited) return limited;
  const { token } = await ctx.params;
  try {
    const url = await retryCheckout(token);
    return Response.json({ url });
  } catch (error) {
    return handleRouteError(error, "Ponowienie płatności");
  }
}
