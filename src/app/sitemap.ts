import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/content/blog";
import { PRIVACY_EFFECTIVE_DATE, TERMS_EFFECTIVE_DATE } from "@/content/legal";
import { ROUTES, absoluteUrl } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

interface SitemapEntry {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
  /** Data ostatniej istotnej zmiany (RRRR-MM-DD); brak = data builda. */
  lastModified?: string;
}

/** Wszystkie publiczne trasy. Panel admina, API i strony statusu zamówień są wyłączone (robots.ts). */
const ENTRIES: readonly SitemapEntry[] = [
  { path: ROUTES.home, priority: 1, changeFrequency: "weekly" },
  { path: ROUTES.order, priority: 0.9, changeFrequency: "monthly" },
  { path: ROUTES.pricing, priority: 0.9, changeFrequency: "monthly" },
  { path: ROUTES.freeSample, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.offices, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.portfolio, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.howItWorks, priority: 0.7, changeFrequency: "monthly" },
  { path: ROUTES.comparison, priority: 0.7, changeFrequency: "monthly" },
  { path: ROUTES.blog, priority: 0.7, changeFrequency: "weekly", lastModified: BLOG_POSTS[0]?.publishedAt },
  ...BLOG_POSTS.map(
    (post): SitemapEntry => ({
      path: ROUTES.blogPost(post.slug),
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: post.updatedAt ?? post.publishedAt,
    }),
  ),
  { path: ROUTES.faq, priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.contact, priority: 0.5, changeFrequency: "yearly" },
  { path: ROUTES.terms, priority: 0.2, changeFrequency: "yearly", lastModified: TERMS_EFFECTIVE_DATE },
  { path: ROUTES.privacy, priority: 0.2, changeFrequency: "yearly", lastModified: PRIVACY_EFFECTIVE_DATE },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();
  return ENTRIES.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: entry.lastModified ? new Date(entry.lastModified) : buildDate,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
