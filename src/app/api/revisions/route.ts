import { z } from "zod";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { MAX_PHOTOS } from "@/lib/pricing";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  REVISION_MESSAGE_MAX,
  REVISION_MESSAGE_MIN,
  RevisionError,
  createRevisionRequest,
} from "@/lib/revisions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, { error: "Nieprawidłowy link zamówienia." }),
  photoIds: z
    .array(z.string().min(1).max(64))
    .max(MAX_PHOTOS, { error: "Wybrano za dużo zdjęć." })
    .default([]),
  message: z
    .string({ error: "Opisz, co mamy poprawić." })
    .trim()
    .min(REVISION_MESSAGE_MIN, { error: `Opisz poprawkę nieco dokładniej (min. ${REVISION_MESSAGE_MIN} znaków).` })
    .max(REVISION_MESSAGE_MAX, { error: `Opis może mieć maksymalnie ${REVISION_MESSAGE_MAX} znaków.` }),
});

const LIMIT = { limit: 10, windowMs: 10 * 60_000 };

/** POST /api/revisions { token, photoIds[], message } – zgłoszenie bezpłatnej poprawki. */
export async function POST(request: Request) {
  const limited = rateLimit(`revisions:${getClientIp(request.headers)}`, LIMIT);
  if (!limited.ok) {
    return Response.json(
      { error: "Zbyt wiele prób w krótkim czasie. Odczekaj chwilę i spróbuj ponownie." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await createRevisionRequest(parsed.data);
    return Response.json({ ok: true, count: result.count }, { status: 201 });
  } catch (error) {
    if (error instanceof RevisionError) return jsonError(error.status, error.message);
    return handleRouteError(error, "Zgłoszenie poprawki");
  }
}
