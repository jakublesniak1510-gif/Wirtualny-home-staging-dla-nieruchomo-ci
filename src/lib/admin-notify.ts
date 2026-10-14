import { notifyOrderInProgress } from "@/lib/order-service";
import { notifyRevisionResolved } from "@/lib/revisions";

/**
 * Powiadomienia klienta wywoływane z panelu. Szablony i wysyłkę dostarcza obszar „klient”
 * (`@/lib/order-service`, `@/lib/revisions`). Błąd powiadomienia nigdy nie blokuje operacji w panelu.
 */

/** E-mail „pracujemy nad zamówieniem” – wywołuj RAZ, tylko po atomowym przejściu PAID → IN_PROGRESS. */
export async function notifyOrderInProgressSafe(orderId: string): Promise<void> {
  try {
    const result = await notifyOrderInProgress(orderId);
    if (!result.ok) console.warn("[admin] E-mail „w realizacji” nie wyszedł:", result.skipped ?? result.error);
  } catch (error) {
    console.error("[admin] Błąd powiadomienia „w realizacji”:", error);
  }
}

/**
 * E-mail o zamknięciu poprawki – wywołuj RAZ, po przejściu zgłoszenia do DONE lub REJECTED
 * (funkcja wysyła jeden e-mail na rundę zgłoszeń – patrz kontrakt w src/lib/revisions.ts).
 */
export async function notifyRevisionResolvedSafe(revisionId: string): Promise<void> {
  try {
    const result = await notifyRevisionResolved(revisionId);
    if (!result.ok && !result.skipped) console.warn("[admin] E-mail o poprawce nie wyszedł:", result.error);
  } catch (error) {
    console.error("[admin] Błąd powiadomienia o poprawce:", error);
  }
}
