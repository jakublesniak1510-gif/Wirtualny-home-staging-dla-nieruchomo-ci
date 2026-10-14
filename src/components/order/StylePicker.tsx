"use client";

import { STYLES } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

interface StylePickerProps {
  value: StyleSlug;
  onChange: (slug: StyleSlug) => void;
  compact?: boolean;
}

/** Wybór stylu: karty-radio z paletą kolorów z src/lib/styles.ts. */
export function StylePicker({ value, onChange, compact = false }: StylePickerProps) {
  return (
    <fieldset>
      <legend className="sr-only">Styl aranżacji</legend>
      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {STYLES.map((style) => {
          const checked = style.slug === value;
          return (
            <label
              key={style.slug}
              className={`relative flex cursor-pointer flex-col rounded-card border bg-surface p-4 transition-shadow has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                checked ? "border-brand shadow-lift ring-1 ring-brand" : "border-line hover:border-brand/50"
              }`}
            >
              <input
                type="radio"
                name="styl"
                value={style.slug}
                checked={checked}
                onChange={() => onChange(style.slug)}
                className="sr-only"
              />
              <span className="flex h-8 overflow-hidden rounded-lg" aria-hidden="true">
                {style.palette.map((color) => (
                  <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="mt-3 flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{style.name}</span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    checked ? "border-brand bg-brand" : "border-line"
                  }`}
                  aria-hidden="true"
                >
                  {checked && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </span>
              {!compact && <span className="mt-1 text-sm leading-snug text-muted">{style.description}</span>}
              {!compact && (
                <span className="mt-2 text-xs text-ink/70">{style.keywords.join(" · ")}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
