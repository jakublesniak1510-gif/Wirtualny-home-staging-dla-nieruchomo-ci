import { z } from "zod";
import { adminGuard } from "@/lib/admin-auth";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  internalNotes: z.string().max(5000, { error: "Notatka może mieć maks. 5000 znaków." }),
});

/** PATCH /api/admin/orders/<id>/notes { internalNotes } – notatki wewnętrzne (autosave). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/notes">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await prisma.order.updateMany({
      where: { id },
      data: { internalNotes: parsed.data.internalNotes.trim() || null },
    });
    if (result.count === 0) return jsonError(404, "Nie znaleziono zamówienia.");
    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error, "Zapis notatek");
  }
}
