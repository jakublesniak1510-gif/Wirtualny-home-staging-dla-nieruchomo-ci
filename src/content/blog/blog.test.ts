import { describe, expect, it } from "vitest";
import {
  countWords,
  countWordsInText,
  getRelatedPosts,
  getTableOfContents,
  readingMinutes,
  slugifyPL,
  sortPosts,
} from "./helpers";
import { BLOG_CATEGORIES, BLOG_POSTS, getPostBySlug } from "./index";
import type { BlogBlock, BlogPost } from "./types";

function fakePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    slug: "a",
    title: "A",
    description: "",
    publishedAt: "2026-01-01",
    readingMinutes: 1,
    category: "poradniki",
    summary: ["", "", ""],
    image: { src: "", alt: "" },
    keywords: [],
    body: [],
    ...overrides,
  };
}

describe("liczenie słów i czas czytania", () => {
  it("liczy słowa, pomija same myślniki", () => {
    expect(countWordsInText("Ala ma kota – i psa")).toBe(5);
    expect(countWordsInText("  ")).toBe(0);
  });

  it("liczy wszystkie typy bloków", () => {
    const blocks: BlogBlock[] = [
      { type: "h2", text: "Dwa słowa" },
      { type: "p", text: "trzy słowa tutaj", link: { href: "/", label: "link" } },
      { type: "ul", items: ["jeden", "dwa trzy"] },
      { type: "note", title: "Uwaga", text: "tekst" },
    ];
    expect(countWords(blocks)).toBe(2 + 4 + 3 + 2);
  });

  it("czas czytania zaokrąglany w górę, minimum 1 minuta", () => {
    expect(readingMinutes([])).toBe(1);
    const words = Array.from({ length: 401 }, () => "słowo").join(" ");
    expect(readingMinutes([{ type: "p", text: words }])).toBe(3);
    expect(readingMinutes([{ type: "p", text: words }], 100)).toBe(5);
  });
});

describe("sortowanie i powiązane", () => {
  const posts = [
    fakePost({ slug: "stary", title: "B", publishedAt: "2026-01-01", category: "prawo", keywords: ["x"] }),
    fakePost({ slug: "nowy", title: "C", publishedAt: "2026-03-01", category: "rynek", keywords: ["y"] }),
    fakePost({ slug: "sredni", title: "A", publishedAt: "2026-02-01", category: "prawo", keywords: ["x", "y"] }),
    fakePost({ slug: "sredni2", title: "Ą", publishedAt: "2026-02-01", category: "style", keywords: [] }),
  ];

  it("od najnowszego, przy remisie alfabetycznie po polsku", () => {
    expect(sortPosts(posts).map((p) => p.slug)).toEqual(["nowy", "sredni", "sredni2", "stary"]);
  });

  it("powiązane: najpierw ta sama kategoria, potem wspólne słowa kluczowe, bez bieżącego", () => {
    const current = fakePost({ slug: "biezacy", category: "prawo", keywords: ["y"] });
    const related = getRelatedPosts(current, posts, 3).map((p) => p.slug);
    expect(related).toEqual(["sredni", "stary", "nowy"]);
    expect(getRelatedPosts(posts[0], posts, 10).map((p) => p.slug)).not.toContain("stary");
  });
});

describe("kotwice i spis treści", () => {
  it("slugifyPL usuwa polskie znaki i interpunkcję", () => {
    expect(slugifyPL("Ile kosztuje wirtualny home staging w Polsce?")).toBe(
      "ile-kosztuje-wirtualny-home-staging-w-polsce",
    );
    expect(slugifyPL("Światło: dzień, nie słońce")).toBe("swiatlo-dzien-nie-slonce");
    expect(slugifyPL("Żółć – źródło")).toBe("zolc-zrodlo");
  });

  it("spis treści ma unikalne kotwice", () => {
    const toc = getTableOfContents([
      { type: "h2", text: "Podsumowanie" },
      { type: "p", text: "x" },
      { type: "h2", text: "Podsumowanie" },
    ]);
    expect(toc.map((t) => t.id)).toEqual(["podsumowanie", "podsumowanie-2"]);
  });
});

describe("treść bloga", () => {
  it("ma 6 artykułów z unikalnymi slugami", () => {
    expect(BLOG_POSTS).toHaveLength(6);
    expect(new Set(BLOG_POSTS.map((p) => p.slug)).size).toBe(6);
  });

  it.each(BLOG_POSTS.map((p) => [p.slug, p] as const))("%s: 700–1100 słów, poprawne metadane", (_slug, post) => {
    const words = countWords(post.body);
    expect(words).toBeGreaterThanOrEqual(700);
    expect(words).toBeLessThanOrEqual(1100);
    expect(post.readingMinutes).toBe(readingMinutes(post.body));
    expect(post.description.length).toBeLessThanOrEqual(170);
    expect(post.summary).toHaveLength(3);
    expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(BLOG_CATEGORIES.map((c) => c.slug)).toContain(post.category);
    expect(post.image.src).toMatch(/^\/portfolio\/.+\.svg$/);
    expect(getPostBySlug(post.slug)).toBe(post);
  });
});
