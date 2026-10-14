import { randomBytes, randomInt } from "node:crypto";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { REVISION_WINDOW_DAYS, isAddonSlug } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { SITE } from "@/lib/site";

/** Czyste helpery zamówień (bez bazy) – łatwe do testowania. */

/** Numer zamówienia do komunikacji z klientem, np. „WS-K3J9X0QZ”. */
export function getOrderNumber(id: string): string {
  return `WS-${id.slice(-8).toUpperCase()}`;
}

/** Odwrotność getOrderNumber dla wyszukiwarki: „WS-K3J9X0QZ” → „k3j9x0qz” (koniec id). */
export function parseOrderNumber(input: string): string | null {
  const match = /^(?:WS-?)?([A-Za-z0-9]{8})$/i.exec(input.trim());
  return match ? match[1].toLowerCase() : null;
}

/** Darmowa próbka: realizacja 24–48 h – jako termin przyjmujemy górną granicę. */
export const SAMPLE_TURNAROUND_HOURS = 48;

/** Godziny realizacji zamówienia. */
export function getTurnaroundHours(express: boolean, isSample = false): number {
  if (isSample) return SAMPLE_TURNAROUND_HOURS;
  return express ? SITE.expressHours : SITE.turnaroundHours;
}

export interface DeadlineInput {
  createdAt: Date;
  paidAt?: Date | null;
  express: boolean;
  isSample?: boolean;
}

/**
 * Termin realizacji: od opłacenia (a gdy brak – od złożenia) + 24 h (ekspres: 6 h,
 * darmowa próbka: 48 h).
 */
export function getDeadline(order: DeadlineInput): Date {
  const start = order.paidAt ?? order.createdAt;
  return new Date(start.getTime() + getTurnaroundHours(order.express, order.isSample) * 3_600_000);
}

const ACTIVE_STATUSES: readonly OrderStatus[] = ["PAID", "IN_PROGRESS"];

/** Opłacone i jeszcze niegotowe zamówienie po terminie. */
export function isOverdue(
  order: DeadlineInput & { status: OrderStatus },
  now: Date = new Date(),
): boolean {
  return ACTIVE_STATUSES.includes(order.status) && getDeadline(order).getTime() < now.getTime();
}

/** Czy klient może jeszcze zgłosić bezpłatną poprawkę (REVISION_WINDOW_DAYS od dostarczenia). */
export function isRevisionWindowOpen(deliveredAt: Date | null, now: Date = new Date()): boolean {
  if (!deliveredAt) return false;
  return now.getTime() - deliveredAt.getTime() < REVISION_WINDOW_DAYS * 24 * 3_600_000;
}

/** Czy data ważności (np. kodu pakietu) już minęła. */
export function isExpired(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && expiresAt.getTime() < now.getTime();
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Przyjęte",
  PAID: "Opłacone",
  IN_PROGRESS: "W realizacji",
  READY: "Gotowe",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Nieopłacone",
  PAID: "Opłacone",
  FREE: "Bez płatności",
  REFUNDED: "Zwrócone",
};

/** Kolejne etapy na osi statusu (CANCELLED poza osią). */
export const STATUS_TIMELINE: readonly OrderStatus[] = [
  "NEW",
  "PAID",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

/** Indeks etapu na osi (−1 dla anulowanych). */
export function getTimelineIndex(status: OrderStatus): number {
  return STATUS_TIMELINE.indexOf(status);
}

/** Losowy, nie do zgadnięcia token do publicznego adresu /zamowienie/[token]. */
export function generatePublicToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Alfabet kodów bez znaków mylących (0/O, 1/I/L). */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Kod pakietu w formacie WS-XXXX-XXXX. */
export function generatePackageCode(): string {
  const part = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `WS-${part()}-${part()}`;
}

/** Lista dodatków z pola JSON Order.addons (nieznane wartości pomijane). */
export function parseAddons(json: string): AddonSlug[] {
  try {
    const value: unknown = JSON.parse(json);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AddonSlug => typeof item === "string" && isAddonSlug(item));
  } catch {
    return [];
  }
}

/** Rozszerzenie pliku dla typu MIME obrazów obsługiwanych w serwisie. */
export function extensionForMime(mime: string): "jpg" | "png" | "webp" | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export function mimeForExtension(ext: string): string {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

/** Bezpieczna nazwa pliku do pobrania, np. „WS-ABCD1234-03-wizualizacja.jpg”. */
export function downloadFileName(
  orderNumber: string,
  index: number,
  kind: "oryginal" | "wizualizacja",
  key: string,
): string {
  const ext = key.split(".").pop() ?? "jpg";
  return `${orderNumber}-${String(index + 1).padStart(2, "0")}-${kind}.${ext}`;
}
