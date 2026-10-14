import { z } from "zod";
import { adminGuard } from "@/lib/admin-auth";
import { ReferralError, issueReferralReward } from "@/lib/admin-referrals";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ referralCode: z.string().trim().min(1).max(200) });

/**
 * POST /api/admin/referrals { referralCode } – wydaje nagrodę polecającemu:
 * kod pakietu na REFERRAL_REWARD_PHOTOS zdjęć + e-mail. Odp.: { packageCode, orders, emailSent, emailError? }.
 */
export async function POST(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const reward = await issueReferralReward(parsed.data.referralCode);
    return Response.json(reward, { status: 201 });
  } catch (error) {
    if (error instanceof ReferralError) return jsonError(error.status, error.message);
    return handleRouteError(error, "Wydanie nagrody za polecenie");
  }
}
