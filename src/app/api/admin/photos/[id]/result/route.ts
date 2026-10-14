import { adminUnauthorized, isAdminRequest } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ImageValidationError, getMaxUploadBytes, getMaxUploadMb, inspectImage, isAllowedMime } from "@/lib/images";
import { getStorage } from "@/lib/storage";
import { applyWatermark } from "@/lib/watermark";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/photos/<photoId>/result – multipart `file` z gotową wizualizacją.
 * Znak wodny „wizualizacja” nakładany automatycznie; zapisujemy WYŁĄCZNIE wersję ze znakiem.
 * Ponowne wgranie podmienia wynik. Odp.: { resultKey, width, height }.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/photos/[id]/result">) {
  if (!isAdminRequest(request)) return adminUnauthorized();
  const { id } = await ctx.params;
  const photo = await prisma.photo.findUnique({ where: { id }, include: { order: true } });
  if (!photo) return jsonError(404, "Nie znaleziono zdjęcia.");
  if (photo.order.status === "CANCELLED") return jsonError(409, "Zamówienie jest anulowane.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Nie udało się odczytać przesłanego pliku.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError(400, "Wybierz plik z wizualizacją.");
  const maxBytes = getMaxUploadBytes() * 2;
  if (file.size > maxBytes) return jsonError(413, `Plik jest za duży (maks. ${getMaxUploadMb() * 2} MB).`);
  if (!isAllowedMime(file.type)) return jsonError(415, "Dozwolone formaty: JPG, PNG, WebP.");

  try {
    const input = Buffer.from(await file.arrayBuffer());
    await inspectImage(input, { minShortSide: 1 });
    const result = await applyWatermark(input);
    const storage = getStorage();
    const key = `orders/${photo.orderId}/result/${photo.sortOrder + 1}-${Date.now()}.${result.ext}`;
    await storage.put(key, result.buffer, result.mime);

    await prisma.$transaction([
      prisma.photo.update({
        where: { id: photo.id },
        data: { resultKey: key, resultUploadedAt: new Date() },
      }),
      ...(photo.order.status === "PAID"
        ? [prisma.order.update({ where: { id: photo.orderId }, data: { status: "IN_PROGRESS" } })]
        : []),
    ]);
    if (photo.resultKey && photo.resultKey !== key) {
      await storage.delete(photo.resultKey).catch(() => undefined);
    }
    return Response.json({ resultKey: key, width: result.width, height: result.height });
  } catch (error) {
    if (error instanceof ImageValidationError) return jsonError(422, error.message);
    console.error("[admin] Błąd zapisu wyniku:", error);
    return jsonError(500, "Nie udało się zapisać wizualizacji.");
  }
}
