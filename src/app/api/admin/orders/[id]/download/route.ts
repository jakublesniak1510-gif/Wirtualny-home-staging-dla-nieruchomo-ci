import { adminUnauthorized, isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { downloadFileName, getOrderNumber } from "@/lib/orders";
import { zipResponse } from "@/lib/zip";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/orders/<id>/download – ZIP z oryginałami zdjęć klienta (tylko admin). */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/download">) {
  if (!isAdminRequest(request)) return adminUnauthorized();
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!order) return Response.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
  if (order.filesDeletedAt) {
    return Response.json({ error: "Pliki tego zamówienia zostały już usunięte." }, { status: 410 });
  }
  const number = getOrderNumber(order.id);
  return zipResponse(
    order.photos.map((photo, index) => ({
      key: photo.originalKey,
      name: downloadFileName(number, index, "oryginal", photo.originalKey),
    })),
    `${number}-oryginaly.zip`,
  );
}
