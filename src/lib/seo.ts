import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** Obrazek OpenGraph (public/og.png – generowany przez scripts/generate-illustrations.mjs). */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE.name} – ${SITE.tagline}`,
} as const;

interface PageMetadataInput {
  /** Tytuł strony (szablon z layoutu dopisze „ | nazwa serwisu”). */
  title: string;
  description: string;
  /** Ścieżka strony, np. ROUTES.pricing – trafia do canonical i og:url. */
  path: string;
  /** false = noindex (np. strony techniczne). */
  index?: boolean;
}

/**
 * Metadane podstrony: title, description, canonical, OpenGraph i Twitter.
 * Uwaga: `openGraph` z podstrony ZASTĘPUJE ten z layoutu (płytkie scalanie),
 * dlatego powtarzamy tu obrazek, nazwę serwisu i locale.
 */
export function pageMetadata({ title, description, path, index = true }: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      siteName: SITE.name,
      title: fullTitle,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
