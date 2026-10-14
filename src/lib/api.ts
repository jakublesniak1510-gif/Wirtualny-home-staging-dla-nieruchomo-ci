import { z } from "zod";
import { ImageValidationError } from "@/lib/images";
import { OrderError } from "@/lib/order-service";
import { PricingError } from "@/lib/pricing";
import { StorageError } from "@/lib/storage";
import { PaymentsNotConfiguredError } from "@/lib/stripe";
import { formatZodError } from "@/lib/validation";

/** Wspólne odpowiedzi błędów tras API (komunikaty PL dla UI). */

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error, ...extra }, { status });
}

/** Parsuje JSON z body (null, gdy niepoprawny). */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function validationError(error: z.ZodError): Response {
  return Response.json(formatZodError(error), { status: 400 });
}

/** Mapuje znane wyjątki na odpowiedzi; nieznane → 500 z ogólnym komunikatem. */
export function handleRouteError(error: unknown, context: string): Response {
  if (error instanceof OrderError) return jsonError(error.status, error.message);
  if (error instanceof PaymentsNotConfiguredError) return jsonError(503, error.message);
  if (error instanceof ImageValidationError) return jsonError(400, error.message);
  if (error instanceof PricingError) return jsonError(400, error.message);
  if (error instanceof StorageError) return jsonError(400, error.message);
  if (error instanceof z.ZodError) return validationError(error);
  console.error(`[api] ${context}:`, error);
  return jsonError(500, "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za chwilę.");
}
