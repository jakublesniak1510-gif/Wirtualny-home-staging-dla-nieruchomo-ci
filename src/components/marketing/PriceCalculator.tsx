"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { formatPLN, formatPLNShort, formatPhotoCount } from "@/lib/format";
import {
  ADDONS,
  BULK_THRESHOLD,
  EXPRESS_RATE,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PRICE_BULK,
  calculateOrderPrice,
  getAddon,
  grossToNet,
} from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { DEFAULT_STYLE, STYLES, isStyleSlug } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";
import { buildOrderHref } from "./order-link";
import { clampInt } from "./savings";

/** Kalkulator ceny na /cennik – liczy tym samym calculateOrderPrice co kreator zamówienia. */
export function PriceCalculator() {
  const [photos, setPhotos] = useState(5);
  const [addons, setAddons] = useState<AddonSlug[]>([]);
  const [express, setExpress] = useState(false);
  const [style, setStyle] = useState<StyleSlug>(DEFAULT_STYLE);
  const id = useId();

  const price = calculateOrderPrice({ photoCount: photos, addons, express });
  const missingForBulk = BULK_THRESHOLD - photos;
  const href = buildOrderHref({ style, photoCount: photos, addons, express });

  function toggleAddon(slug: AddonSlug, checked: boolean) {
    setAddons((current) => (checked ? [...current, slug] : current.filter((s) => s !== slug)));
  }

  const rows: { label: string; value: number }[] = [
    {
      label: `${formatPhotoCount(price.photoCount)} × ${formatPLNShort(price.unitPrice)}`,
      value: price.base,
    },
    ...price.addonSlugs.map((slug) => {
      const addon = getAddon(slug);
      return {
        label: `${addon.name} × ${price.photoCount}`,
        value: addon.pricePerPhoto * price.photoCount,
      };
    }),
    ...(price.express > 0
      ? [{ label: `Ekspres (+${Math.round(EXPRESS_RATE * 100)}% ceny bazowej)`, value: price.express }]
      : []),
  ];

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1.2fr_1fr]">
      <form
        className="space-y-6 border-b border-line p-6 sm:p-8 lg:border-b-0 lg:border-r"
        aria-label="Kalkulator ceny zamówienia"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-photos`} className="text-sm font-medium text-ink">
              Liczba zdjęć
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_PHOTOS}
              max={MAX_PHOTOS}
              value={photos}
              onChange={(event) => setPhotos(clampInt(Number(event.target.value), MIN_PHOTOS, MAX_PHOTOS))}
              aria-label="Liczba zdjęć (pole liczbowe)"
              className="w-20 rounded-control border border-line bg-surface px-3 py-1.5 text-right font-semibold text-ink"
            />
          </div>
          <input
            id={`${id}-photos`}
            type="range"
            min={MIN_PHOTOS}
            max={MAX_PHOTOS}
            value={photos}
            onChange={(event) => setPhotos(Number(event.target.value))}
            aria-valuetext={formatPhotoCount(photos)}
            className="mt-3 h-2 w-full cursor-pointer accent-brand"
          />
          <p className="mt-2 text-xs text-muted">
            {missingForBulk > 0
              ? `Dodaj jeszcze ${formatPhotoCount(missingForBulk)}, a każde będzie kosztować ${formatPLNShort(PRICE_BULK)}.`
              : `Cena hurtowa: ${formatPLNShort(PRICE_BULK)} za zdjęcie (od ${BULK_THRESHOLD} zdjęć).`}
          </p>
        </div>

        <div>
          <label htmlFor={`${id}-style`} className="text-sm font-medium text-ink">
            Styl aranżacji
          </label>
          <select
            id={`${id}-style`}
            value={style}
            onChange={(event) => {
              if (isStyleSlug(event.target.value)) setStyle(event.target.value);
            }}
            className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-2.5 text-ink"
          >
            {STYLES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">Styl nie wpływa na cenę.</p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-ink">Dodatki (za każde zdjęcie)</legend>
          <div className="mt-2 space-y-2">
            {ADDONS.map((addon) => (
              <label
                key={addon.slug}
                className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3 text-sm hover:border-brand"
              >
                <input
                  type="checkbox"
                  checked={addons.includes(addon.slug)}
                  onChange={(event) => toggleAddon(addon.slug, event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span className="flex-1">
                  <span className="block font-medium text-ink">{addon.name}</span>
                  <span className="block text-xs text-muted">{addon.description}</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-ink">+{formatPLNShort(addon.pricePerPhoto)}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-sand-light/50 p-3 text-sm hover:border-brand">
              <input
                type="checkbox"
                checked={express}
                onChange={(event) => setExpress(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand"
              />
              <span className="flex-1">
                <span className="block font-medium text-ink">Ekspres – gotowe do {SITE.expressHours} h</span>
                <span className="block text-xs text-muted">Zamiast {SITE.turnaroundHours} h. Dopłata od ceny bazowej.</span>
              </span>
              <span className="whitespace-nowrap font-semibold text-ink">+{Math.round(EXPRESS_RATE * 100)}%</span>
            </label>
          </div>
        </fieldset>
      </form>

      <div className="flex flex-col bg-cream/50 p-6 sm:p-8">
        <h3 className="text-base font-semibold text-ink">Twoje zamówienie</h3>
        <dl className="mt-4 space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4">
              <dt className="text-muted">{row.label}</dt>
              <dd className="whitespace-nowrap text-ink">{formatPLN(row.value)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 border-t border-line pt-4" aria-live="polite" aria-atomic="true">
          <p className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold text-ink">Razem brutto</span>
            <span className="text-3xl font-semibold tracking-tight text-brand">{formatPLN(price.total)}</span>
          </p>
          <p className="mt-1 text-right text-xs text-muted">
            {formatPLN(price.net)} netto + {formatPLN(price.vat)} VAT · średnio {formatPLN(price.perPhoto)} (
            {formatPLN(grossToNet(price.perPhoto))} netto) za zdjęcie
          </p>
        </div>
        <div className="mt-auto pt-6">
          <Link href={href} className="btn-primary w-full">
            Zamów z tymi ustawieniami
          </Link>
          <p className="mt-2 text-center text-xs text-muted">
            Styl, dodatki i ekspres przeniesiemy do formularza. Zdjęcia wgrasz w pierwszym kroku.
          </p>
        </div>
      </div>
    </div>
  );
}
