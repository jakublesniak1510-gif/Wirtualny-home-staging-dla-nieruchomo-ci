import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/orders/<token>/status – lekki odczyt statusu (odpytywany po powrocie z płatności). */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[token]/status">) {
  const { token } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    select: {
      status: true,
      paymentStatus: true,
      photos: { select: { resultKey: true } },
    },
  });
  if (!order) return Response.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
  return Response.json(
    {
      status: order.status,
      paymentStatus: order.paymentStatus,
      resultsReady: order.photos.filter((p) => p.resultKey).length,
      photoCount: order.photos.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
