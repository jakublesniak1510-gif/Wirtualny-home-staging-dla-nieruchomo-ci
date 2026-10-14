"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PORTFOLIO } from "@/content/portfolio";
import { ROUTES } from "@/lib/site";
import { STYLES, getStyle } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

type Filter = "wszystkie" | StyleSlug;

/** Style, dla których mamy co najmniej jedną parę w portfolio (kolejność jak w STYLES). */
const AVAILABLE_STYLES = STYLES.filter((style) => PORTFOLIO.some((item) => item.slug === style.slug));

/** Galeria przed/po z prostym filtrem po stylu. */
export function PortfolioGallery() {
  const [filter, setFilter] = useState<Filter>("wszystkie");
  const items = filter === "wszystkie" ? PORTFOLIO : PORTFOLIO.filter((item) => item.slug === filter);

  const options: { value: Filter; label: string }[] = [
    { value: "wszystkie", label: "Wszystkie style" },
    ...AVAILABLE_STYLES.map((style) => ({ value: style.slug, label: style.name })),
  ];

  return (
    <div>
      <div role="group" aria-label="Filtruj realizacje według stylu" className="-mx-1 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === filter;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.value)}
              className={`mx-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink/80 hover:border-brand hover:text-brand"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {filter === "wszystkie"
          ? `Wyświetlono wszystkie realizacje: ${items.length}.`
          : `Wyświetlono realizacje w stylu ${getStyle(filter).name}: ${items.length}.`}
      </p>

      <ul className="mt-8 grid gap-10 md:grid-cols-2">
        {items.map((item) => {
          const style = getStyle(item.slug);
          return (
            <li key={item.slug}>
              <figure>
                <BeforeAfterSlider
                  beforeSrc={item.beforeSrc}
                  afterSrc={item.afterSrc}
                  beforeAlt={item.beforeAlt}
                  afterAlt={item.afterAlt}
                  label={`Porównanie przed i po: ${item.title.toLowerCase()}, styl ${style.name.toLowerCase()}`}
                  sizes="(min-width: 768px) 560px, 100vw"
                />
                <figcaption className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{item.title}</h2>
                    <Badge tone="neutral">{style.name}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {item.room} · {item.area}&nbsp;m² – {item.description}
                  </p>
                  <div className="mt-4 rounded-control border border-line bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">Styl {style.name.toLowerCase()}</p>
                      <span className="flex -space-x-1.5" aria-hidden="true">
                        {style.palette.map((color) => (
                          <span
                            key={color}
                            className="h-4 w-4 rounded-full border-2 border-surface"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{style.description}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Charakterystyczne elementy stylu ${style.name}`}>
                      {style.keywords.map((keyword) => (
                        <li key={keyword} className="rounded-full bg-cream px-2.5 py-1 text-xs text-ink/80">
                          {keyword}
                        </li>
                      ))}
                    </ul>
                    <Link href={`${ROUTES.order}?styl=${style.slug}`} className="link mt-3 inline-flex text-sm">
                      Zamów w tym stylu<span aria-hidden="true">&nbsp;→</span>
                    </Link>
                  </div>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
