import { z } from "zod";
import { adminGuard } from "@/lib/admin-auth";
import { notifyRevisionResolvedSafe } from "@/lib/admin-notify";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const REVISION_ADMIN_STATUSES = ["IN_PROGRESS", "DONE", "REJECTED"] as const;

const schema = z.object({
  status: z.enum(REVISION_ADMIN_STATUSES, { error: "Nieprawidłowy status zgłoszenia." }),
  reply: z.string().max(2000, { error: "Odpowiedź może mieć maks. 2000 znaków." }).optional(),
});

/**
 * PATCH /api/admin/revisions/<id> { status: IN_PROGRESS|DONE|REJECTED, reply? }
 * Po pierwszym zamknięciu (DONE lub REJECTED) wywołujemy notifyRevisionResolved – e-mail do klienta
 * (jeden na rundę zgłoszeń, zgodnie z kontraktem w src/lib/revisions.ts).
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/revisions/[id]">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { status, reply } = parsed.data;
  try {
    const existing = await prisma.revisionRequest.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Nie znaleziono zgłoszenia.");
    const resolved = status === "DONE" || status === "REJECTED";
    const updated = await prisma.revisionRequest.update({
      where: { id },
      data: {
        status,
        reply: reply === undefined ? existing.reply : reply.trim() || null,
        resolvedAt: resolved ? (existing.resolvedAt ?? new Date()) : null,
      },
    });
    const wasResolved = existing.status === "DONE" || existing.status === "REJECTED";
    if (resolved && !wasResolved) await notifyRevisionResolvedSafe(id);
    return Response.json({ id: updated.id, status: updated.status, reply: updated.reply, resolvedAt: updated.resolvedAt });
  } catch (error) {
    return handleRouteError(error, "Zmiana statusu poprawki");
  }
}
