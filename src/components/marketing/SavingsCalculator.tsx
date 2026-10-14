"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { MARKET_SOURCE_NOTE } from "@/content/market";
import { formatPLNShort, formatPhotoCount, pluralizePL } from "@/lib/format";
import { MAX_PHOTOS, MIN_PHOTOS, OFFICE_PLAN } from "@/lib/pricing";
import { ROUTES } from "@/lib/site";
import { MAX_LISTINGS, MIN_LISTINGS, calculateSavings, cheaperMode, monthlyCost } from "./savings";
import type { BillingMode } from "./savings";

const MODES: readonly { value: BillingMode; label: string; hint: string }[] = [
  { value: "single", label: "Płacę za zdjęcia", hint: "osobne zamówienie dla każdej oferty" },
  { value: "subscription", label: "Abonament dla biura", hint: `${OFFICE_PLAN.photosPerMonth} zdjęć / mies.` },
];

/** Zaokrąglenie do pełnych złotych – kalkulator pokazuje orientacyjne kwoty. */
const zl = (grosze: number) => formatPLNShort(Math.round(grosze / 100) * 100);

function Slider({
  id,
  label,
  value,
  min,
  max,
  onChange,
  format,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="text-lg font-semibold text-brand">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={format(value)}
        className="mt-3 h-2 w-full cursor-pointer accent-brand"
      />
      <div className="mt-1 flex justify-between text-xs text-muted" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

interface SavingsCalculatorProps {
  /** id nagłówka sekcji, w której osadzony jest kalkulator (dla aria-labelledby formularza). */
  labelledBy?: string;
  initialPhotos?: number;
  initialListings?: number;
}

export function SavingsCalculator({ labelledBy, initialPhotos = 6, initialListings = 1 }: SavingsCalculatorProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [listings, setListings] = useState(initialListings);
  const [mode, setMode] = useState<BillingMode>("single");
  const id = useId();

  const result = calculateSavings({ photosPerListing: photos, listingsPerMonth: listings, mode });
  const better = cheaperMode(photos, listings);
  const betterCost = monthlyCost(photos, listings, better);
  const physicalMax = result.physicalMonthly.max;
  const ourWidth = Math.max(1.5, (result.ourMonthly / physicalMax) * 100);
  const physicalMinWidth = (result.physicalMonthly.min / physicalMax) * 100;

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1fr_1.15fr]">
      <form
        className="space-y-7 border-b border-line p-6 sm:p-8 lg:border-b-0 lg:border-r"
        aria-labelledby={labelledBy}
        onSubmit={(event) => event.preventDefault()}
      >
        <fieldset>
          <legend className="text-sm font-medium text-ink">Sposób rozliczenia</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {MODES.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer flex-col rounded-control border px-4 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                  mode === option.value ? "border-brand bg-brand-light" : "border-line bg-surface hover:border-brand"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-mode`}
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="sr-only"
                />
                <span className="font-semibold text-ink">{option.label}</span>
                <span className="text-xs text-muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Slider
          id={`${id}-photos`}
          label="Zdjęć na jedną ofertę"
          value={photos}
          min={MIN_PHOTOS}
          max={MAX_PHOTOS}
          onChange={setPhotos}
          format={formatPhotoCount}
        />
        <Slider
          id={`${id}-listings`}
          label="Ofert (mieszkań) miesięcznie"
          value={listings}
          min={MIN_LISTINGS}
          max={MAX_LISTINGS}
          onChange={setListings}
          format={(value) => `${value} ${pluralizePL(value, ["oferta", "oferty", "ofert"])}`}
        />
        {better !== mode && (
          <p className="rounded-control border border-sand/60 bg-sand-light/60 px-4 py-3 text-sm text-ink">
            Przy takich ustawieniach taniej wyjdzie{" "}
            <strong className="font-semibold">{better === "subscription" ? "abonament" : "płatność za zdjęcia"}</strong>{" "}
            – {zl(betterCost.gross)} brutto miesięcznie.{" "}
            <button type="button" className="link" onClick={() => setMode(better)}>
              Przelicz
            </button>
          </p>
        )}
      </form>

      <div className="bg-cream/50 p-6 sm:p-8">
        <div aria-live="polite" aria-atomic="true">
          <p className="text-sm font-medium text-muted">
            Oszczędzasz miesięcznie ({formatPhotoCount(result.photosPerMonth)} łącznie)
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
            {zl(result.savings.min)}–{zl(result.savings.max)}
          </p>
          <p className="mt-1 text-sm text-ink">
            czyli <strong className="font-semibold">{result.savingsPercent.min}–{result.savingsPercent.max}%</strong>{" "}
            kosztu fizycznego home stagingu
          </p>
        </div>

        <div className="mt-6 space-y-4" aria-hidden="true">
          <div>
            <div className="flex justify-between text-xs text-muted">
              <span>Wirtualny staging</span>
              <span>{zl(result.ourMonthly)}</span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-line/70">
              <div className="h-3 rounded-full bg-brand transition-[width] duration-300" style={{ width: `${ourWidth}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted">
              <span>Fizyczny home staging</span>
              <span>
                {zl(result.physicalMonthly.min)}–{zl(result.physicalMonthly.max)}
              </span>
            </div>
            <div className="relative mt-1 h-3 rounded-full bg-sand-light">
              <div className="absolute inset-y-0 left-0 rounded-full bg-sand/50" style={{ width: "100%" }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-sand" style={{ width: `${physicalMinWidth}%` }} />
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-control border border-line bg-surface p-4">
            <dt className="text-muted">Nasz koszt / mies.</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">{zl(result.ourMonthly)} brutto</dd>
            <dd className="text-xs text-muted">
              {zl(result.ourMonthlyNet)} netto
              {result.mode === "subscription"
                ? ` · ${result.plansNeeded} × abonament`
                : ` · ${zl(result.ourPerListing)} za ofertę`}
            </dd>
          </div>
          <div className="rounded-control border border-line bg-surface p-4">
            <dt className="text-muted">Fizyczny staging / mies.</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">
              {zl(result.physicalMonthly.min)}–{zl(result.physicalMonthly.max)}
            </dd>
            <dd className="text-xs text-muted">orientacyjnie, za całe mieszkania</dd>
          </div>
          <div className="rounded-control border border-line bg-surface p-4">
            <dt className="text-muted">Czas – u nas</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">do {result.ourHours}&nbsp;h</dd>
          </div>
          <div className="rounded-control border border-line bg-surface p-4">
            <dt className="text-muted">Czas – fizyczny staging</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">
              {result.physicalDays.min}–{result.physicalDays.max} dni
            </dd>
          </div>
        </dl>

        {result.mode === "subscription" && result.plansNeeded > 1 && (
          <p className="mt-4 text-xs text-muted">
            Ponad {OFFICE_PLAN.photosPerMonth} zdjęć miesięcznie? Kalkulator liczy wielokrotność abonamentu – w praktyce
            przygotujemy indywidualną wycenę.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {result.mode === "subscription" ? (
            <Link href={ROUTES.offices} className="btn-primary">
              Zapytaj o abonament
            </Link>
          ) : (
            <Link href={ROUTES.order} className="btn-primary">
              Zamów wizualizacje
            </Link>
          )}
          <Link href={ROUTES.freeSample} className="btn-secondary">
            Najpierw darmowa próbka
          </Link>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">{MARKET_SOURCE_NOTE}</p>
      </div>
    </div>
  );
}
