import { prisma } from "@/lib/db";
import { downloadFileName, getOrderNumber } from "@/lib/orders";
import { zipResponse } from "@/lib/zip";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/orders/<token>/download – ZIP z gotowymi wizualizacjami (dostęp przez publiczny token). */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[token]/download">) {
  const { token } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!order) return Response.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
  if (order.filesDeletedAt) {
    return Response.json({ error: "Pliki tego zamówienia zostały już usunięte." }, { status: 410 });
  }
  const number = getOrderNumber(order.id);
  const entries = order.photos.flatMap((photo, index) =>
    photo.resultKey
      ? [{ key: photo.resultKey, name: downloadFileName(number, index, "wizualizacja", photo.resultKey) }]
      : [],
  );
  if (entries.length === 0) {
    return Response.json({ error: "Wizualizacje nie są jeszcze gotowe." }, { status: 409 });
  }
  return zipResponse(entries, `${number}-wizualizacje.zip`);
}
