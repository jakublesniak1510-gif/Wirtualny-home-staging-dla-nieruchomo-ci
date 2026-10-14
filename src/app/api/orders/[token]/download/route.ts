import { prisma } from "@/lib/db";
import { buildReadmeText, buildVariantZipEntries, getOrderNumber } from "@/lib/orders";
import { ROUTES, absoluteUrl } from "@/lib/site";
import { getStyleName } from "@/lib/styles";
import { zipResponse } from "@/lib/zip";
import type { ZipEntry } from "@/lib/zip";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const README_NAME = "CZYTAJ.txt";

/**
 * GET /api/orders/<token>/download – ZIP ze wszystkimi wariantami gotowych wizualizacji
 * (główny wynik + dodatkowe PhotoResult) i plikiem CZYTAJ.txt. Dostęp przez publiczny token.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[token]/download">) {
  const { token } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) {
    return Response.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
  }
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          resultKey: true,
          results: { select: { id: true, key: true, label: true, sortOrder: true, createdAt: true } },
        },
      },
    },
  });
  if (!order) return Response.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
  if (order.filesDeletedAt) {
    return Response.json({ error: "Pliki tego zamówienia zostały już usunięte." }, { status: 410 });
  }
  const number = getOrderNumber(order.id);
  const files = buildVariantZipEntries(number, order.photos);
  if (files.length === 0) {
    return Response.json({ error: "Wizualizacje nie są jeszcze gotowe." }, { status: 409 });
  }
  const readme = buildReadmeText({
    orderNumber: number,
    styleName: getStyleName(order.style),
    photoCount: order.photos.length,
    fileNames: files.map((file) => file.name),
    termsUrl: absoluteUrl(ROUTES.terms),
    statusUrl: absoluteUrl(ROUTES.orderStatus(order.publicToken)),
    deliveredAt: order.deliveredAt,
  });
  const entries: ZipEntry[] = [{ name: README_NAME, content: readme }, ...files];
  return zipResponse(entries, `${number}-wizualizacje.zip`);
}
