import Link from "next/link";
import { Badge } from "@/components/Badge";
import { formatPLN, formatPLNShort, formatPhotoCount } from "@/lib/format";
import {
  ADDONS,
  BULK_THRESHOLD,
  EXPRESS_RATE,
  INCLUDED_REVISIONS,
  MAX_PHOTOS,
  PRICE_BULK,
  PRICE_SINGLE,
  REVISION_WINDOW_DAYS,
  calculateOrderPrice,
  grossToNet,
} from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";

interface PriceTableProps {
  /** compact – landing; full – strona /cennik (z przykładami wyliczeń). */
  variant?: "compact" | "full";
  /** Przykładowe liczby zdjęć w tabeli wyliczeń (variant="full"). */
  examples?: readonly number[];
  className?: string;
}

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" focusable="false">
    <path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Cennik zasilany wyłącznie stałymi z src/lib/pricing.ts. */
export function PriceTable({ variant = "compact", examples = [1, 5, 10, 20], className = "" }: PriceTableProps) {
  const bulkExample = calculateOrderPrice({ photoCount: BULK_THRESHOLD });
  const features = [
    `Gotowe w ${SITE.turnaroundHours} h`,
    "Styl aranżacji do wyboru",
    `${INCLUDED_REVISIONS} bezpłatna poprawka (${REVISION_WINDOW_DAYS} dni)`,
    "Oznaczenie „wizualizacja” na każdym zdjęciu",
  ];

  const tiers = [
    {
      name: `Od 1 do ${BULK_THRESHOLD - 1} zdjęć`,
      price: PRICE_SINGLE,
      note: "Idealne na jedno ogłoszenie",
      highlighted: false,
    },
    {
      name: `Od ${BULK_THRESHOLD} do ${MAX_PHOTOS} zdjęć`,
      price: PRICE_BULK,
      note: `${formatPhotoCount(BULK_THRESHOLD)} = ${formatPLNShort(bulkExample.total)} – cena naliczana automatycznie`,
      highlighted: true,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-4 md:grid-cols-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`card relative flex flex-col p-6 sm:p-8 ${tier.highlighted ? "border-brand ring-1 ring-brand" : ""}`}
          >
            {tier.highlighted && (
              <Badge className="absolute -top-3 left-6 shadow-soft" tone="solid">
                Taniej o {formatPLNShort(PRICE_SINGLE - PRICE_BULK)} na zdjęciu
              </Badge>
            )}
            <h3 className="text-base font-semibold text-ink">{tier.name}</h3>
            <p className="mt-1 text-sm text-muted">{tier.note}</p>
            <div className="mt-6">
              <p>
                <span className="text-4xl font-semibold tracking-tight text-ink">{formatPLNShort(tier.price)}</span>{" "}
                <span className="text-sm text-muted">/ zdjęcie brutto</span>
              </p>
              <p className="mt-1 text-xs text-muted">{formatPLN(grossToNet(tier.price))} netto</p>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-ink">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <caption className="px-6 pt-6 text-left text-base font-semibold text-ink">
            Dodatki (cena za każde zdjęcie)
          </caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Dodatek</th>
              <th scope="col">Cena brutto za zdjęcie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ADDONS.map((addon) => (
              <tr key={addon.slug}>
                <th scope="row" className="px-6 py-4 align-top font-normal">
                  <span className="block font-medium text-ink">{addon.name}</span>
                  <span className="mt-0.5 block text-muted">{addon.description}</span>
                </th>
                <td className="whitespace-nowrap px-6 py-4 text-right align-top">
                  <span className="block font-semibold text-ink">+{formatPLNShort(addon.pricePerPhoto)}</span>
                  <span className="block text-xs text-muted">+{formatPLN(grossToNet(addon.pricePerPhoto))} netto</span>
                </td>
              </tr>
            ))}
            <tr className="bg-sand-light/50">
              <th scope="row" className="px-6 py-4 align-top font-normal">
                <span className="block font-medium text-ink">Ekspres – gotowe do {SITE.expressHours} h</span>
                <span className="mt-0.5 block text-muted">Dopłata liczona od ceny bazowej całego zamówienia.</span>
              </th>
              <td className="whitespace-nowrap px-6 py-4 text-right align-top font-semibold text-ink">
                +{Math.round(EXPRESS_RATE * 100)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {variant === "full" && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="px-6 pt-6 text-left text-base font-semibold text-ink">
              Przykładowe wyliczenia (bez dodatków)
            </caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="px-6 py-3 font-medium">Liczba zdjęć</th>
                <th scope="col" className="px-6 py-3 font-medium">Cena za zdjęcie</th>
                <th scope="col" className="px-6 py-3 font-medium">Razem brutto</th>
                <th scope="col" className="px-6 py-3 font-medium">Razem netto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {examples.map((count) => {
                const price = calculateOrderPrice({ photoCount: count });
                return (
                  <tr key={count}>
                    <th scope="row" className="px-6 py-3 font-medium text-ink">{formatPhotoCount(count)}</th>
                    <td className="px-6 py-3">{formatPLN(price.unitPrice)}</td>
                    <td className="px-6 py-3 font-semibold text-ink">{formatPLN(price.total)}</td>
                    <td className="px-6 py-3 text-muted">{formatPLN(price.net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Ceny brutto zawierają 23% VAT. Wystawiamy faktury VAT. Płatność BLIK, kartą lub Przelewy24.{" "}
        Masz kod pakietu? Wpiszesz go w <Link href={ROUTES.order} className="link">formularzu zamówienia</Link>.
      </p>
    </div>
  );
}
