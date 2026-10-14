/** Style aranżacji dostępne w zamówieniu. Slug zapisujemy w Order.style. */

export interface StagingStyle {
  slug: string;
  name: string;
  /** Jedno zdanie opisu. */
  description: string;
  /** 3–4 słowa kluczowe (meble, materiały, kolory). */
  keywords: readonly string[];
  /** Paleta do próbek kolorów w UI (hex). */
  palette: readonly [string, string, string, string];
}

export const STYLES = [
  {
    slug: "skandynawski",
    name: "Skandynawski",
    description: "Jasno, przytulnie i funkcjonalnie – biel, jasne drewno i miękkie tkaniny.",
    keywords: ["jasny dąb", "biel i szarości", "wełniane pledy", "rośliny"],
    palette: ["#f2efe9", "#d9c3a0", "#8fa3b5", "#4a4f55"],
  },
  {
    slug: "nowoczesny",
    name: "Nowoczesny",
    description: "Czyste linie, stonowane barwy i wyraziste akcenty dla miejskich wnętrz.",
    keywords: ["grafitowa sofa", "czarne detale", "koniak", "geometria"],
    palette: ["#e6e6e6", "#3a3d42", "#b0896b", "#1c1c1e"],
  },
  {
    slug: "loft",
    name: "Loft (industrialny)",
    description: "Surowe materiały i charakter – cegła, metal, skóra i ciemne drewno.",
    keywords: ["skórzana sofa", "czarny metal", "stare drewno", "cegła"],
    palette: ["#9a5a43", "#8b4a2b", "#6b4a35", "#2b2b2b"],
  },
  {
    slug: "klasyczny",
    name: "Klasyczny",
    description: "Elegancja ponad modą – sztukaterie, welur, mosiądz i symetria.",
    keywords: ["granatowy welur", "mosiądz", "marmur", "sztukateria"],
    palette: ["#efe6d8", "#2d3e5c", "#c9a87c", "#b98a5b"],
  },
  {
    slug: "boho",
    name: "Boho",
    description: "Ciepło, naturalne sploty i dużo zieleni – swobodnie i z duszą.",
    keywords: ["rattan", "terakota", "juta", "makrama"],
    palette: ["#f0e4d4", "#c0673f", "#d9a441", "#5f7a4a"],
  },
  {
    slug: "japandi",
    name: "Japandi",
    description: "Spokój i minimalizm – niskie meble, naturalne drewno i ziemiste barwy.",
    keywords: ["niskie meble", "ciemne drewno", "len", "szałwia"],
    palette: ["#ece6dc", "#b8b09c", "#5a4636", "#7c8a6e"],
  },
] as const satisfies readonly StagingStyle[];

export type StyleSlug = (typeof STYLES)[number]["slug"];

export const STYLE_SLUGS: readonly StyleSlug[] = STYLES.map((style) => style.slug);

export const DEFAULT_STYLE: StyleSlug = "skandynawski";

export function isStyleSlug(value: string): value is StyleSlug {
  return (STYLE_SLUGS as readonly string[]).includes(value);
}

export function getStyle(slug: StyleSlug): StagingStyle {
  const style = STYLES.find((s) => s.slug === slug);
  if (!style) throw new Error(`Nieznany styl: ${slug}`);
  return style;
}

/** Nazwa stylu dla dowolnego stringa (np. z bazy); fallback = sam slug. */
export function getStyleName(slug: string): string {
  return isStyleSlug(slug) ? getStyle(slug).name : slug;
}
