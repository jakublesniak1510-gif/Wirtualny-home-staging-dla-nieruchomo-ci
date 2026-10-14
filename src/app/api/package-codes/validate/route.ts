import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { findUsablePackageCode } from "@/lib/order-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { codeValidateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/package-codes/validate { code } → { valid: true, code, creditsLeft, expiresAt } lub błąd. */
export async function POST(request: Request) {
  const limited = checkRateLimit("codeValidate", request.headers);
  if (limited) return limited;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Podaj kod pakietu.");
  const parsed = codeValidateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const code = await findUsablePackageCode(parsed.data.code);
    return Response.json({
      valid: true,
      code: code.code,
      creditsLeft: code.creditsLeft,
      expiresAt: code.expiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleRouteError(error, "Walidacja kodu");
  }
}
