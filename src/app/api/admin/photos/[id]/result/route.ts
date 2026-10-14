import { adminGuard } from "@/lib/admin-auth";
import { saveWatermarkedResult } from "@/lib/admin-results";
import { readResultUpload } from "@/lib/admin-upload";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ImageValidationError } from "@/lib/images";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/photos/<photoId>/result – multipart `file` z gotową wizualizacją (wynik główny).
 * Znak wodny „wizualizacja” nakładany automatycznie; zapisujemy WYŁĄCZNIE wersję ze znakiem.
 * Ponowne wgranie podmienia wynik. Odp.: { resultKey, width, height }.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/photos/[id]/result">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const photo = await prisma.photo.findUnique({ where: { id }, include: { order: true } });
  if (!photo) return jsonError(404, "Nie znaleziono zdjęcia.");
  if (photo.order.status === "CANCELLED") return jsonError(409, "Zamówienie jest anulowane.");

  try {
    const upload = await readResultUpload(request);
    if (upload instanceof Response) return upload;
    const saved = await saveWatermarkedResult(photo, upload.buffer, { asPrimary: true, source: "manual" });
    return Response.json({ resultKey: saved.key, width: saved.width, height: saved.height });
  } catch (error) {
    if (error instanceof ImageValidationError) return jsonError(422, error.message);
    console.error("[admin] Błąd zapisu wyniku:", error);
    return jsonError(500, "Nie udało się zapisać wizualizacji.");
  }
}
