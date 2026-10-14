import { formatPLN, formatPhotoCount } from "@/lib/format";
import { BULK_THRESHOLD, EXPRESS_RATE, PRICE_BULK, PRICE_SINGLE, getAddon } from "@/lib/pricing";
import type { PriceBreakdown } from "@/lib/pricing";

interface PriceSummaryProps {
  breakdown: PriceBreakdown;
  /** Liczba faktycznie dodanych zdjęć (0 = cena poglądowa). */
  photoCount: number;
  /** Planowana liczba zdjęć z kalkulatora (gdy jeszcze nic nie wgrano). */
  plannedPhotoCount?: number;
  styleName: string;
  turnaroundHours: number;
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 text-sm ${muted ? "text-muted" : "text-ink"}`}>
      <dt>{label}</dt>
      <dd className="shrink-0 font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** Podsumowanie ceny liczone na żywo z calculateOrderPrice. */
export function PriceSummary({ breakdown, photoCount, plannedPhotoCount, styleName, turnaroundHours }: PriceSummaryProps) {
  const toBulk = BULK_THRESHOLD - photoCount;
  return (
    <div>
      <dl className="divide-y divide-line/70">
        <Row
          label={`Zdjęcia: ${breakdown.photoCount} × ${formatPLN(breakdown.unitPrice)}`}
          value={formatPLN(breakdown.base)}
        />
        {breakdown.addonSlugs.map((slug) => {
          const addon = getAddon(slug);
          return (
            <Row
              key={slug}
              label={`${addon.name}: ${breakdown.photoCount} × ${formatPLN(addon.pricePerPhoto)}`}
              value={formatPLN(addon.pricePerPhoto * breakdown.photoCount)}
            />
          );
        })}
        {breakdown.express > 0 && (
          <Row label={`Ekspres (+${Math.round(EXPRESS_RATE * 100)}% ceny bazowej)`} value={formatPLN(breakdown.express)} />
        )}
        {breakdown.discount > 0 && (
          <Row
            label={`Kredyty z pakietu: ${breakdown.creditsUsed} × ${formatPLN(breakdown.unitPrice)}`}
            value={`−${formatPLN(breakdown.discount)}`}
          />
        )}
      </dl>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-ink/10 pt-3">
        <span className="text-base font-semibold text-ink">Razem</span>
        <span className="text-right">
          <span className="block text-2xl font-semibold tabular-nums text-ink" data-testid="cena-razem">
            {formatPLN(breakdown.total)}
          </span>
          <span className="block text-xs text-muted">
            brutto · netto {formatPLN(breakdown.net)} + VAT {formatPLN(breakdown.vat)}
          </span>
        </span>
      </div>

      {photoCount === 0 && (
        <p className="mt-3 text-xs text-muted">
          {plannedPhotoCount
            ? `Cena poglądowa dla ${formatPhotoCount(plannedPhotoCount)} – wgraj zdjęcia, aby zobaczyć kwotę zamówienia.`
            : "Cena poglądowa dla 1 zdjęcia – dodaj zdjęcia, aby zobaczyć kwotę zamówienia."}
        </p>
      )}
      {breakdown.bulkApplied ? (
        <p className="mt-3 rounded-control bg-brand-light px-3 py-2 text-sm text-brand">
          Rabat ilościowy: {formatPLN(PRICE_BULK)} zamiast {formatPLN(PRICE_SINGLE)} za zdjęcie – oszczędzasz{" "}
          {formatPLN((PRICE_SINGLE - PRICE_BULK) * breakdown.photoCount)}.
        </p>
      ) : (
        photoCount > 0 &&
        toBulk > 0 && (
          <p className="mt-3 text-xs text-muted">
            Dodaj jeszcze {formatPhotoCount(toBulk)}, a cena spadnie do {formatPLN(PRICE_BULK)} za każde zdjęcie.
          </p>
        )
      )}
      <ul className="mt-4 space-y-1 text-xs text-muted">
        <li>Styl: {styleName}</li>
        <li>Gotowe w {turnaroundHours} h od zaksięgowania płatności</li>
      </ul>
    </div>
  );
}
