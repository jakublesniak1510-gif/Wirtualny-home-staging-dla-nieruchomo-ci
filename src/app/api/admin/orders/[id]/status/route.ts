import { adminUnauthorized, isAdminRequest } from "@/lib/admin-auth";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { cancelOrder } from "@/lib/order-service";
import { adminStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/<id>/status { status: IN_PROGRESS|READY|DELIVERED|CANCELLED }.
 * Anulowanie zwalnia kredyty kodu pakietu. DELIVERED tutaj NIE wysyła e-maila
 * (do tego służy /deliver).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/status">) {
  if (!isAdminRequest(request)) return adminUnauthorized();
  const { id } = await ctx.params;
  const parsed = adminStatusSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { status } = parsed.data;

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return jsonError(404, "Nie znaleziono zamówienia.");
    if (status === "CANCELLED") {
      await cancelOrder(id);
      return Response.json({ status: "CANCELLED" });
    }
    if (order.status === "CANCELLED") return jsonError(409, "Zamówienie jest anulowane.");
    if (order.paymentStatus === "UNPAID") {
      return jsonError(409, "Zamówienie nie jest opłacone – nie można zmienić statusu realizacji.");
    }
    await prisma.order.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === "DELIVERED" ? (order.deliveredAt ?? new Date()) : order.deliveredAt,
      },
    });
    return Response.json({ status });
  } catch (error) {
    return handleRouteError(error, "Zmiana statusu");
  }
}
