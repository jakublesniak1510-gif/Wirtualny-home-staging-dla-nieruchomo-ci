import { z } from "zod";
import { adminGuard } from "@/lib/admin-auth";
import { MAX_RESULT_LABEL, normalizeLabel } from "@/lib/admin-results";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  label: z.string().max(MAX_RESULT_LABEL, { error: `Etykieta może mieć maks. ${MAX_RESULT_LABEL} znaków.` }).nullable(),
});

/** PATCH /api/admin/photo-results/<id> { label } – zmiana etykiety wariantu klienta. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/photo-results/[id]">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const existing = await prisma.photoResult.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Nie znaleziono wariantu.");
    const updated = await prisma.photoResult.update({ where: { id }, data: { label: normalizeLabel(parsed.data.label) } });
    return Response.json({ id: updated.id, label: updated.label });
  } catch (error) {
    return handleRouteError(error, "Zmiana etykiety wariantu");
  }
}

/** DELETE /api/admin/photo-results/<id> – usuwa wariant klienta (plik i rekord). */
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/photo-results/[id]">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const existing = await prisma.photoResult.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Nie znaleziono wariantu.");
    await prisma.photoResult.delete({ where: { id } });
    await getStorage().delete(existing.key).catch(() => undefined);
    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Usuwanie wariantu");
  }
}
