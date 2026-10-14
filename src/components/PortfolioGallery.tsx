"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { CheckIcon } from "@/components/CheckIcon";
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
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-control border border-line bg-surface p-4">
                      <h3 className="text-sm font-semibold text-brand">Co zmieniliśmy</h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-ink">
                        {item.changes.map((change) => (
                          <li key={change} className="flex gap-2">
                            <CheckIcon className="h-4 w-4 translate-y-0.5 text-brand" />
                            <span className="first-letter:uppercase">{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-control border border-line bg-cream/60 p-4">
                      <h3 className="text-sm font-semibold text-ink">Czego NIE zmieniliśmy</h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-ink">
                        {item.unchanged.map((element) => (
                          <li key={element} className="flex gap-2">
                            <svg
                              viewBox="0 0 20 20"
                              className="h-4 w-4 shrink-0 translate-y-0.5 text-muted"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <rect x="4.5" y="9" width="11" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                            <span className="first-letter:uppercase">{element}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 rounded-control border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
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
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{style.keywords.join(" · ")}</p>
                    </div>
                    <Link href={`${ROUTES.order}?styl=${style.slug}`} className="btn-primary shrink-0">
                      Zamów w tym stylu
                      <span className="sr-only">: {style.name}</span>
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
