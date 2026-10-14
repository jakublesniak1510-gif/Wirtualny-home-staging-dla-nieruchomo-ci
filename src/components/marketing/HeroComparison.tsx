"use client";

import Image from "next/image";
import { useState } from "react";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PORTFOLIO } from "@/content/portfolio";
import type { PortfolioItem } from "@/content/portfolio";
import { getStyleName } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

const HERO_SLUGS: readonly StyleSlug[] = ["skandynawski", "loft", "japandi"];
const ITEMS: readonly PortfolioItem[] = HERO_SLUGS.map((slug) => PORTFOLIO.find((item) => item.slug === slug)).filter(
  (item): item is PortfolioItem => item !== undefined,
);

/** Suwak przed/po w hero + miniatury 3 stylów (klik zmienia parę w suwaku). */
export function HeroComparison() {
  const [active, setActive] = useState(0);
  const item = ITEMS[active];
  const styleName = getStyleName(item.slug).toLowerCase();

  return (
    <figure>
      <BeforeAfterSlider
        beforeSrc={item.beforeSrc}
        afterSrc={item.afterSrc}
        beforeAlt={item.beforeAlt}
        afterAlt={item.afterAlt}
        label={`Porównanie przed i po: ${item.title.toLowerCase()}, styl ${styleName}`}
        initial={45}
        priority
        sizes="(min-width: 1024px) 600px, 100vw"
      />
      <div role="group" aria-label="Wybierz przykład do porównania" className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {ITEMS.map((option, index) => {
          const selected = index === active;
          return (
            <button
              key={option.slug}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(index)}
              className={`group overflow-hidden rounded-control border bg-surface text-left transition-colors ${
                selected ? "border-brand ring-2 ring-brand" : "border-line hover:border-brand"
              }`}
            >
              <span className="relative block aspect-[3/2] bg-cream">
                <Image
                  src={option.afterSrc}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 190px, 33vw"
                  className="object-cover"
                  loading="eager"
                />
              </span>
              <span className={`block px-2 py-1.5 text-xs font-semibold sm:text-sm ${selected ? "text-brand" : "text-ink/80"}`}>
                {getStyleName(option.slug).replace(/\s*\(.*\)$/, "")}
              </span>
            </button>
          );
        })}
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">
        Przesuń suwak, aby porównać. {item.room}, {item.area}&nbsp;m², styl {styleName} (ilustracja poglądowa).
      </figcaption>
    </figure>
  );
}
