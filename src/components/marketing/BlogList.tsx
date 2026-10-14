"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BLOG_CATEGORIES } from "@/content/blog/types";
import type { BlogCategory } from "@/content/blog/types";
import { formatDatePL } from "@/lib/format";
import { ROUTES } from "@/lib/site";

export interface BlogListItem {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  categoryLabel: string;
  publishedAt: string;
  readingMinutes: number;
  image: { src: string; alt: string };
}

type Filter = "wszystkie" | BlogCategory;

/** Lista artykułów z filtrem kategorii (wszystkie artykuły są w HTML od początku – filtr tylko ukrywa). */
export function BlogList({ posts }: { posts: readonly BlogListItem[] }) {
  const [filter, setFilter] = useState<Filter>("wszystkie");
  const categories = BLOG_CATEGORIES.filter((category) => posts.some((post) => post.category === category.slug));
  const options: { value: Filter; label: string; count: number }[] = [
    { value: "wszystkie", label: "Wszystkie", count: posts.length },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.label,
      count: posts.filter((post) => post.category === category.slug).length,
    })),
  ];
  const visible = filter === "wszystkie" ? posts : posts.filter((post) => post.category === filter);

  return (
    <div>
      <div role="group" aria-label="Filtruj artykuły według kategorii" className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === filter;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink/80 hover:border-brand hover:text-brand"
              }`}
            >
              {option.label} <span className={active ? "text-white/80" : "text-muted"}>({option.count})</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        Wyświetlono artykułów: {visible.length}.
      </p>

      <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((post) => (
          <li key={post.slug}>
            <article className="card group relative flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[3/2] bg-cream">
                <Image
                  src={post.image.src}
                  alt={post.image.alt}
                  fill
                  sizes="(min-width: 1024px) 352px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sand-dark">{post.categoryLabel}</p>
                <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">
                  <Link href={ROUTES.blogPost(post.slug)} className="after:absolute after:inset-0 group-hover:text-brand">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.description}</p>
                <p className="mt-4 text-xs text-muted">
                  <time dateTime={post.publishedAt}>{formatDatePL(post.publishedAt)}</time> · {post.readingMinutes} min
                  czytania
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
