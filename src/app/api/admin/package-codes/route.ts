import { Prisma } from "@prisma/client";
import { adminUnauthorized, isAdminRequest } from "@/lib/admin-auth";
import { handleRouteError, jsonError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { generatePackageCode } from "@/lib/orders";
import { packageCodeCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/package-codes – lista kodów (najnowsze pierwsze). */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();
  const codes = await prisma.packageCode.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return Response.json({ codes });
}

/**
 * POST /api/admin/package-codes { credits, email?, note?, expiresAt?: "RRRR-MM-DD" }
 * → 201 { code } (kod generowany w formacie WS-XXXX-XXXX).
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Nieprawidłowe dane.");
  const parsed = packageCodeCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { credits, email, note, expiresAt } = parsed.data;

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const code = await prisma.packageCode.create({
          data: {
            code: generatePackageCode(),
            creditsTotal: credits,
            creditsLeft: credits,
            email,
            note,
            expiresAt,
          },
        });
        return Response.json({ code }, { status: 201 });
      } catch (error) {
        // P2002 = kolizja unikalnego kodu – losujemy ponownie.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
        throw error;
      }
    }
    return jsonError(500, "Nie udało się wygenerować unikalnego kodu. Spróbuj ponownie.");
  } catch (error) {
    return handleRouteError(error, "Tworzenie kodu pakietu");
  }
}
