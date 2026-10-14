/**
 * Artykuły bloga. Nowy artykuł: utwórz plik w tym katalogu (eksport `post: BlogPostSource`)
 * i dopisz go do SOURCES. Kolejność nie ma znaczenia – lista jest sortowana po dacie.
 */
import { post as homeStagingSale } from "./home-staging-a-sprzedaz";
import { post as photoGuide } from "./jak-fotografowac-puste-mieszkanie";
import { post as developerState } from "./stan-deweloperski-jak-pokazac-potencjal";
import { post as styles } from "./style-wnetrz-ktore-sprzedaja";
import { post as law } from "./wirtualny-staging-a-prawo";
import { post as whatIsIt } from "./wirtualny-home-staging-co-to-jest";
import { finalizePost, getRelatedPosts, sortPosts } from "./helpers";
import type { BlogCategory, BlogPost } from "./types";

export * from "./types";
export { getCategoryLabel, getTableOfContents, slugifyPL } from "./helpers";

const SOURCES = [whatIsIt, homeStagingSale, photoGuide, styles, law, developerState];

/** Wszystkie artykuły, od najnowszego. */
export const BLOG_POSTS: readonly BlogPost[] = sortPosts(SOURCES.map(finalizePost));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.category === category);
}

export function getRelated(post: BlogPost, limit = 3): BlogPost[] {
  return getRelatedPosts(post, BLOG_POSTS, limit);
}
