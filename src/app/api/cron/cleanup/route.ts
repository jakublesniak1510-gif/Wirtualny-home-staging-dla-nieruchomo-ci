import { safeEqual } from "@/lib/secrets";
import { runCleanup } from "@/lib/cleanup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET|POST /api/cron/cleanup – sprzątanie starych plików.
 * Autoryzacja: nagłówek `Authorization: Bearer <CRON_SECRET>`. `?dry=1` – tylko raport.
 */
async function handle(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return Response.json({ error: "CRON_SECRET nie jest ustawiony." }, { status: 503 });
  const header = request.headers.get("authorization") ?? "";
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Brak dostępu." }, { status: 401 });
  }
  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  try {
    const report = await runCleanup({ dryRun });
    return Response.json(report);
  } catch (error) {
    console.error("[cron] Błąd sprzątania:", error);
    return Response.json({ error: "Błąd sprzątania – szczegóły w logach." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
