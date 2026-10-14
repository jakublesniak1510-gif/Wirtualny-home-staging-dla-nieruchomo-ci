import { AiGenerationError } from "@/lib/ai/generate";
import { handleRouteError, jsonError } from "@/lib/api";

/** Wspólna obsługa błędów tras panelu (dodatkowo błędy generowania AI). */
export function handleAdminError(error: unknown, context: string): Response {
  if (error instanceof AiGenerationError) return jsonError(error.status, error.message);
  return handleRouteError(error, context);
}
