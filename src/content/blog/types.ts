/** Typy bloga – treść w prostym formacie strukturalnym (bez MDX). */

export const BLOG_CATEGORIES = [
  { slug: "poradniki", label: "Poradniki" },
  { slug: "rynek", label: "Rynek i sprzedaż" },
  { slug: "style", label: "Style wnętrz" },
  { slug: "prawo", label: "Prawo i uczciwość" },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["slug"];

export interface BlogLink {
  href: string;
  label: string;
}

export type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  /** Akapit; opcjonalny link dopisywany na końcu akapitu. */
  | { type: "p"; text: string; link?: BlogLink }
  | { type: "ul"; items: readonly string[] }
  | { type: "ol"; items: readonly string[] }
  /** Wyróżniona ramka (wskazówka, zastrzeżenie). */
  | { type: "note"; title?: string; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description (≤ 160 znaków). */
  description: string;
  /** Data publikacji RRRR-MM-DD. */
  publishedAt: string;
  /** Data aktualizacji RRRR-MM-DD (opcjonalnie). */
  updatedAt?: string;
  /** Liczone automatycznie z treści (helpers.ts). */
  readingMinutes: number;
  category: BlogCategory;
  /** Podsumowanie w 3 punktach – na górze artykułu. */
  summary: readonly [string, string, string];
  /** Ilustracja nagłówkowa (istniejące SVG portfolio). */
  image: { src: string; alt: string };
  keywords: readonly string[];
  body: readonly BlogBlock[];
}

/** Artykuł w źródle – bez pól wyliczanych. */
export type BlogPostSource = Omit<BlogPost, "readingMinutes">;
