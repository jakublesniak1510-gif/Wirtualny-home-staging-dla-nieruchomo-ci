import { adminGuard } from "@/lib/admin-auth";
import { handleAdminError } from "@/lib/admin-api";
import { deleteVariant } from "@/lib/ai/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** DELETE /api/admin/ai-variants/<id> – usuwa wariant AI (plik i rekord). */
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/ai-variants/[id]">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await deleteVariant(id);
    return Response.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, "Usuwanie wariantu AI");
  }
}
