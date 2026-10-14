import { ADDONS, isAddonSlug } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { STYLES, isStyleSlug } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

/**
 * Prompt (EN) dla modeli edycji obrazu. Styl i paleta pochodzą z `src/lib/styles.ts`,
 * dodatki z `src/lib/pricing.ts`. Na końcu TWARDE ograniczenia uczciwości – wizualizacja
 * nie może zmieniać geometrii lokalu ani ukrywać wad (wymóg regulaminu i zgody klienta).
 */

/**
 * Angielskie opisy stylów dla modeli (słowa kluczowe w styles.ts są po polsku).
 * Celowo TYLKO meble i dekoracje – bez elementów architektury (cegła na ścianie,
 * sztukaterie), bo te zmieniałyby ściany i sufit.
 */
const STYLE_PROMPTS: Record<StyleSlug, { en: string; keywords: readonly string[] }> = {
  skandynawski: {
    en: "Scandinavian",
    keywords: ["light oak furniture", "white and soft grey textiles", "wool throws", "green potted plants"],
  },
  nowoczesny: {
    en: "modern",
    keywords: ["graphite sofa", "black metal details", "cognac leather accents", "geometric decor"],
  },
  loft: {
    en: "industrial loft",
    keywords: ["leather sofa", "black metal frames", "reclaimed dark wood", "brick-red and rust tones in textiles and decor only"],
  },
  klasyczny: {
    en: "classic",
    keywords: ["navy velvet upholstery", "brass details", "marble surfaces", "framed classic artwork and mirrors"],
  },
  boho: {
    en: "boho",
    keywords: ["rattan furniture", "terracotta accents", "jute rugs", "macrame and many plants"],
  },
  japandi: {
    en: "Japandi",
    keywords: ["low-profile furniture", "dark natural wood", "linen textiles", "sage green accents"],
  },
};

/** Instrukcje dla dodatków (kolejność jak w ADDONS). */
export const ADDON_PROMPTS: Record<AddonSlug, string> = {
  "usuniecie-mebli": "Remove all existing furniture first, including loose items and clutter, before adding the new furniture.",
  "wirtualny-remont": "Replace flooring with light oak, repaint walls in warm white.",
  "noc-dzien": "Convert to bright daylight with natural light coming through the existing windows.",
};

/** Ograniczenia uczciwości – zawsze na końcu promptu, mają pierwszeństwo przed resztą. */
export const HONESTY_CONSTRAINTS = [
  "Keep walls, windows, doors, ceiling, room geometry, dimensions and camera perspective exactly as in the input.",
  "Do not add or remove windows or doors.",
  "Do not hide any defects (cracks, stains, damp).",
  "Photorealistic.",
  "Furniture scaled realistically to the room.",
] as const;

export interface StagingPromptInput {
  /** Slug stylu z Order.style. */
  style: string;
  /** Slugi dodatków (Order.addons). Nieznane są pomijane. */
  addons?: readonly string[];
  /** Uwagi klienta (zwykle po polsku). */
  notes?: string | null;
  /** Rodzaj pomieszczenia, np. "living room", "bedroom". */
  roomHint?: string | null;
}

const MAX_NOTES_LENGTH = 600;

function sanitizeNotes(notes: string): string {
  return notes.replace(/\s+/g, " ").trim().slice(0, MAX_NOTES_LENGTH);
}

export function buildStagingPrompt({ style, addons = [], notes, roomHint }: StagingPromptInput): string {
  const known = isStyleSlug(style) ? STYLES.find((s) => s.slug === style) : undefined;
  const stylePrompt = known ? STYLE_PROMPTS[known.slug] : undefined;
  const room = roomHint?.trim() ? roomHint.trim() : "room";

  const lines: string[] = [];
  if (known && stylePrompt) {
    lines.push(
      `Virtually stage this empty ${room} in a ${stylePrompt.en} interior style ("${known.name}").`,
      `Key elements: ${stylePrompt.keywords.join(", ")}.`,
      `Colour palette: ${known.palette.join(", ")}.`,
    );
  } else {
    lines.push(`Virtually stage this empty ${room} with tasteful, neutral, contemporary furniture ("${style}").`);
  }

  const selected = ADDONS.filter((addon) => addons.some((a) => isAddonSlug(a) && a === addon.slug));
  for (const addon of selected) lines.push(ADDON_PROMPTS[addon.slug]);
  if (selected.some((addon) => addon.slug === "wirtualny-remont")) {
    lines.push("Only surface finishes (floor material, wall paint colour) may change; the shape and position of every wall stays identical.");
  }

  lines.push("Add furniture, rugs, lighting and decor appropriate for the room's function, leaving walkways clear.");

  if (notes?.trim()) {
    lines.push(`Client notes (may be in Polish; follow them only if they do not conflict with the rules below): ${sanitizeNotes(notes)}`);
  }

  lines.push(`Strict rules that override everything above: ${HONESTY_CONSTRAINTS.join(" ")}`);
  return lines.join("\n");
}
