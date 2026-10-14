import { adminGuard, renewAdminSessionIfNeeded } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/session – odnawia ciasteczko sesji, gdy minęła połowa ważności. */
export async function POST(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const renewed = await renewAdminSessionIfNeeded();
  return Response.json({ ok: true, renewed });
}
