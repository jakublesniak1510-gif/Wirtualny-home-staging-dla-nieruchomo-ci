/**
 * Link do kreatora zamówienia z ustawieniami z kalkulatora:
 * /zamow?styl=<slug>&zdjecia=<n>&dodatki=a,b&ekspres=1
 * Kreator czyta `styl`, `dodatki` i `ekspres`; `zdjecia` jest podpowiedzią (liczbę zdjęć wyznacza upload).
 */
import { ADDONS, MAX_PHOTOS, MIN_PHOTOS } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { ROUTES } from "@/lib/site";
import type { StyleSlug } from "@/lib/styles";
import { clampInt } from "./savings";

export interface OrderLinkInput {
  style?: StyleSlug | null;
  photoCount?: number;
  addons?: readonly AddonSlug[];
  express?: boolean;
}

export function buildOrderHref({ style, photoCount, addons = [], express = false }: OrderLinkInput): string {
  const parts: string[] = [];
  if (style) parts.push(`styl=${encodeURIComponent(style)}`);
  if (photoCount !== undefined) parts.push(`zdjecia=${clampInt(photoCount, MIN_PHOTOS, MAX_PHOTOS)}`);
  // Kolejność jak w cenniku, bez duplikatów.
  const selected = ADDONS.filter((addon) => addons.includes(addon.slug)).map((addon) => addon.slug);
  if (selected.length > 0) parts.push(`dodatki=${selected.join(",")}`);
  if (express) parts.push("ekspres=1");
  return parts.length > 0 ? `${ROUTES.order}?${parts.join("&")}` : ROUTES.order;
}
