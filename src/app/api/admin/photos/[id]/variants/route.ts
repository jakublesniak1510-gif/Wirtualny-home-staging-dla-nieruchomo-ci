import { after } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin-auth";
import { handleAdminError } from "@/lib/admin-api";
import { isAiSync } from "@/lib/ai/config";
import { createVariants, recoverStaleVariants, runVariants } from "@/lib/ai/generate";
import { toVariantView } from "@/lib/ai/view";
import { jsonError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Generowanie w `after()` trwa do końca zadań – na Vercel w granicach maxDuration. */
export const maxDuration = 300;

const bodySchema = z.object({
  count: z.number().int().min(1).max(6).optional(),
  providerId: z.string().trim().min(1).max(40).optional(),
  prompt: z.string().max(4000, { error: "Prompt jest za długi (maks. 4000 znaków)." }).optional(),
});

/** GET /api/admin/photos/<photoId>/variants – lista wariantów AI (najnowsze pierwsze). */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/photos/[id]/variants">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await recoverStaleVariants(id);
    const variants = await prisma.aiVariant.findMany({ where: { photoId: id }, orderBy: { createdAt: "desc" } });
    return Response.json({ variants: variants.map(toVariantView) });
  } catch (error) {
    return handleAdminError(error, "Lista wariantów AI");
  }
}

/**
 * POST /api/admin/photos/<photoId>/variants { count?, providerId?, prompt? }
 * → 202 { variants } (generowanie w tle; strona odpytuje GET co 3 s),
 * przy AI_SYNC=1 → 200 { variants } po zakończeniu generowania.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/photos/[id]/variants">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const created = await createVariants(id, {
      count: parsed.data.count,
      providerId: parsed.data.providerId,
      promptOverride: parsed.data.prompt,
    });
    const ids = created.map((variant) => variant.id);
    if (isAiSync()) {
      await runVariants(ids);
      const done = await prisma.aiVariant.findMany({ where: { id: { in: ids } }, orderBy: { createdAt: "asc" } });
      return Response.json({ variants: done.map(toVariantView) });
    }
    after(() => runVariants(ids));
    return Response.json({ variants: created.map(toVariantView) }, { status: 202 });
  } catch (error) {
    return handleAdminError(error, "Generowanie wariantów AI");
  }
}
