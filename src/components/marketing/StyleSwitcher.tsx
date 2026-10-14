"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ROUTES } from "@/lib/site";
import { STYLES } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

type Option =
  | { kind: "before"; id: "przed"; label: string; src: string; alt: string }
  | { kind: "style"; id: StyleSlug; label: string; src: string; alt: string };

/** Ilustracje generuje scripts/generate-illustrations.mjs (public/portfolio/salon-demo-*.svg). */
const OPTIONS: readonly Option[] = [
  {
    kind: "before",
    id: "przed",
    label: "Przed",
    src: "/portfolio/salon-demo-przed.svg",
    alt: "Pusty salon z oknem, grzejnikiem pod oknem i jasną drewnianą podłogą – zdjęcie przed aranżacją",
  },
  ...STYLES.map(
    (style): Option => ({
      kind: "style",
      id: style.slug,
      label: style.name.replace(/\s*\(.*\)$/, ""),
      src: `/portfolio/salon-demo-${style.slug}.svg`,
      alt: `Ten sam salon urządzony w stylu ${style.name.toLowerCase()}: ${style.keywords.join(", ")} – wizualizacja`,
    }),
  ),
];

const DEFAULT_INDEX = 1;

/** „Ten sam pokój w 6 stylach” – zakładki (WAI-ARIA Tabs, automatyczna aktywacja) z przenikaniem obrazów. */
export function StyleSwitcher() {
  const [selected, setSelected] = useState(DEFAULT_INDEX);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const tabId = (index: number) => `${baseId}-tab-${index}`;

  const current = OPTIONS[selected];
  const style = current.kind === "style" ? STYLES.find((s) => s.slug === current.id) : undefined;

  function select(index: number) {
    const next = (index + OPTIONS.length) % OPTIONS.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys: Record<string, () => void> = {
      ArrowRight: () => select(selected + 1),
      ArrowDown: () => select(selected + 1),
      ArrowLeft: () => select(selected - 1),
      ArrowUp: () => select(selected - 1),
      Home: () => select(0),
      End: () => select(OPTIONS.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Wybierz styl aranżacji salonu"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {OPTIONS.map((option, index) => {
          const active = index === selected;
          const swatch = option.kind === "style" ? STYLES.find((s) => s.slug === option.id)?.palette : undefined;
          return (
            <button
              key={option.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabId(index)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={onKeyDown}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink/80 hover:border-brand hover:text-brand"
              }`}
            >
              {swatch ? (
                <span className="flex -space-x-1" aria-hidden="true">
                  {swatch.slice(0, 3).map((color) => (
                    <span
                      key={color}
                      className="h-3 w-3 rounded-full border border-white/70"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              ) : (
                <span className="h-3 w-3 rounded-full border border-current opacity-60" aria-hidden="true" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(selected)}
        className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center"
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded-card border border-line bg-cream shadow-soft">
          {/* Wszystkie 7 obrazów w DOM (ładowane razem) – przełączanie bez opóźnienia, z przenikaniem. */}
          {OPTIONS.map((option, index) => {
            const visible = index === selected;
            return (
              <Image
                key={option.id}
                src={option.src}
                alt={visible ? option.alt : ""}
                aria-hidden={visible ? undefined : true}
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="crossfade object-cover"
                style={{ opacity: visible ? 1 : 0 }}
                draggable={false}
              />
            );
          })}
          <span
            className={`pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
              current.kind === "before" ? "bg-ink/75" : "bg-brand/90"
            }`}
          >
            {current.kind === "before" ? "Przed – zdjęcie klienta" : `Po – styl ${current.label.toLowerCase()}`}
          </span>
        </div>

        <div>
          {style ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">Styl</p>
              <h3 className="mt-1 text-2xl font-semibold text-ink">{style.name}</h3>
              <p className="mt-3 leading-relaxed text-muted">{style.description}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`Charakterystyczne elementy stylu ${style.name}`}>
                {style.keywords.map((keyword) => (
                  <li key={keyword} className="rounded-full bg-cream px-2.5 py-1 text-xs text-ink/80">
                    {keyword}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2" aria-hidden="true">
                {style.palette.map((color) => (
                  <span key={color} className="h-7 w-7 rounded-full border border-line" style={{ backgroundColor: color }} />
                ))}
              </div>
              <Link href={`${ROUTES.order}?styl=${style.slug}`} className="btn-primary mt-6 w-full sm:w-auto">
                Zamów w tym stylu
                <span className="sr-only">: {style.name}</span>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">Zdjęcie wejściowe</p>
              <h3 className="mt-1 text-2xl font-semibold text-ink">Pusty salon, 21&nbsp;m²</h3>
              <p className="mt-3 leading-relaxed text-muted">
                Tak wygląda zdjęcie, które przysyła klient. Okno, grzejnik, ściany i podłoga zostają na każdej
                wizualizacji dokładnie takie same – zmieniamy tylko meble i dodatki.
              </p>
              <button
                type="button"
                onClick={() => select(DEFAULT_INDEX)}
                className="btn-secondary mt-6 w-full sm:w-auto"
              >
                Zobacz pierwszy styl
              </button>
            </>
          )}
          <p className="mt-4 text-xs text-muted">
            Użyj strzałek, aby przełączać style. Ilustracje poglądowe – każda wizualizacja ma napis „wizualizacja”.
          </p>
        </div>
      </div>
    </div>
  );
}
