/** Funkcje pomocnicze bloga (czyste – testowane w blog.test.ts). */
import { BLOG_CATEGORIES } from "./types";
import type { BlogBlock, BlogCategory, BlogPost, BlogPostSource } from "./types";

/** Średnie tempo czytania tekstu publicystycznego po polsku (słów na minutę). */
export const WORDS_PER_MINUTE = 200;

/** Liczba słów w tekście (ciągi znaków rozdzielone białymi znakami, bez samych myślników). */
export function countWordsInText(text: string): number {
  return text
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Liczba słów w treści artykułu (nagłówki, akapity, listy, ramki). */
export function countWords(blocks: readonly BlogBlock[]): number {
  let total = 0;
  for (const block of blocks) {
    switch (block.type) {
      case "ul":
      case "ol":
        total += block.items.reduce((sum, item) => sum + countWordsInText(item), 0);
        break;
      case "note":
        total += countWordsInText(`${block.title ?? ""} ${block.text}`);
        break;
      case "p":
        total += countWordsInText(`${block.text} ${block.link?.label ?? ""}`);
        break;
      default:
        total += countWordsInText(block.text);
    }
  }
  return total;
}

/** Czas czytania w minutach (zaokrąglony w górę, min. 1). */
export function readingMinutes(blocks: readonly BlogBlock[], wordsPerMinute = WORDS_PER_MINUTE): number {
  return Math.max(1, Math.ceil(countWords(blocks) / wordsPerMinute));
}

/** Uzupełnia artykuł o pola wyliczane. */
export function finalizePost(source: BlogPostSource): BlogPost {
  return { ...source, readingMinutes: readingMinutes(source.body) };
}

/** Od najnowszego; przy tej samej dacie – alfabetycznie po tytule. */
export function sortPosts<T extends Pick<BlogPost, "publishedAt" | "title">>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => {
    if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
    return a.title.localeCompare(b.title, "pl");
  });
}

/**
 * Powiązane artykuły: najpierw ta sama kategoria, potem liczba wspólnych słów kluczowych,
 * na końcu nowsze. Bez bieżącego artykułu.
 */
export function getRelatedPosts(
  post: Pick<BlogPost, "slug" | "category" | "keywords">,
  all: readonly BlogPost[],
  limit = 3,
): BlogPost[] {
  const keywords = new Set(post.keywords.map((k) => k.toLowerCase()));
  const score = (candidate: BlogPost) =>
    (candidate.category === post.category ? 10 : 0) +
    candidate.keywords.filter((k) => keywords.has(k.toLowerCase())).length;

  return sortPosts(all.filter((candidate) => candidate.slug !== post.slug))
    .map((candidate, index) => ({ candidate, index, score: score(candidate) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function getCategoryLabel(category: BlogCategory): string {
  return BLOG_CATEGORIES.find((c) => c.slug === category)?.label ?? category;
}

/** Kotwica z polskiego nagłówka: „Ile to kosztuje?” → „ile-to-kosztuje”. */
export function slugifyPL(text: string): string {
  const map: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => map[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface TocEntry {
  id: string;
  text: string;
}

/** Spis treści z nagłówków H2 (unikalne kotwice). */
export function getTableOfContents(blocks: readonly BlogBlock[]): TocEntry[] {
  const used = new Map<string, number>();
  const entries: TocEntry[] = [];
  for (const block of blocks) {
    if (block.type !== "h2") continue;
    const base = slugifyPL(block.text) || "sekcja";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    entries.push({ id: count === 0 ? base : `${base}-${count + 1}`, text: block.text });
  }
  return entries;
}
