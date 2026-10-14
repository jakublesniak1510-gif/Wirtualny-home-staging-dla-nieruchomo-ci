import { adminGuard } from "@/lib/admin-auth";
import { handleRouteError } from "@/lib/api";
import { deliverOrder } from "@/lib/order-service";

export const dynamic = "force-dynamic";

/** POST /api/admin/orders/<id>/deliver – status DELIVERED + e-mail „Twoje wizualizacje są gotowe”. */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/deliver">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const order = await deliverOrder(id);
    return Response.json({ status: order.status, deliveredAt: order.deliveredAt });
  } catch (error) {
    return handleRouteError(error, "Dostarczenie zamówienia");
  }
}
