import { z } from "zod";
import { adminGuard } from "@/lib/admin-auth";
import { handleAdminError } from "@/lib/admin-api";
import { MAX_RESULT_LABEL } from "@/lib/admin-results";
import { publishVariant } from "@/lib/ai/generate";
import { jsonError, readJson, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  asPrimary: z.boolean(),
  label: z.string().max(MAX_RESULT_LABEL, { error: `Etykieta może mieć maks. ${MAX_RESULT_LABEL} znaków.` }).optional(),
});

/**
 * POST /api/admin/ai-variants/<id>/publish { asPrimary, label? } – znak wodny + zapis jako
 * wynik główny lub wariant dla klienta. Odp.: { key, width, height, photoResultId? }.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/ai-variants/[id]/publish">) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const saved = await publishVariant(id, parsed.data);
    return Response.json(saved);
  } catch (error) {
    return handleAdminError(error, "Publikacja wariantu AI");
  }
}
