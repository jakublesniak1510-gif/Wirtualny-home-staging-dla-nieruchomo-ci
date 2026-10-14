import Link from "next/link";
import { PARTNER_DISCOUNT_RATE } from "@/content/service";
import { formatPLNShort, formatPhotoCount } from "@/lib/format";
import { FREE_SAMPLE_PHOTOS, OFFICE_PLAN, OFFICE_PLAN_APPROX_NET_PER_PHOTO, calculateOrderPrice, getAddon } from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";
import { Reveal } from "./Reveal";

const typical = calculateOrderPrice({ photoCount: 6 });

const AUDIENCES = [
  {
    title: "Agenci nieruchomości",
    benefit: "Więcej zapytań z tego samego ogłoszenia",
    text: `Puste mieszkanie zamieniasz w ofertę, która zatrzymuje wzrok – bez organizowania mebli. Abonament: ok. ${formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)} netto za zdjęcie.`,
    cta: { href: ROUTES.freeSample, label: `${formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę` },
    icon: "M4 20V9l8-5 8 5v11M9 20v-6h6v6",
  },
  {
    title: "Deweloperzy",
    benefit: "Stan deweloperski, który wygląda jak dom",
    text: `Wirtualny remont (podłoga, ściany) i aranżacja na prawdziwych zdjęciach lokali – bez wykańczania mieszkania pokazowego. Priorytet ${OFFICE_PLAN.priorityHours} h w abonamencie.`,
    cta: { href: ROUTES.offices, label: "Oferta dla deweloperów" },
    icon: "M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1",
  },
  {
    title: "Właściciele",
    benefit: "Sprzedaż lub najem bez wydawania na meble",
    text: `Całe ogłoszenie z sześcioma zdjęciami to ${formatPLNShort(typical.total)} – zamiast tysięcy złotych za fizyczny staging. Gotowe w ${SITE.turnaroundHours} h.`,
    cta: { href: ROUTES.order, label: "Zamów wizualizacje" },
    icon: "M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 20a7 7 0 0 1 14 0",
  },
  {
    title: "Fotografowie nieruchomości",
    benefit: `Nowa usługa dla klientów – rabat ${Math.round(PARTNER_DISCOUNT_RATE * 100)}%`,
    text: `Dodaj wirtualny staging do sesji i odsprzedawaj go agentom. Usuniemy też stare meble (${getAddon("usuniecie-mebli").name.toLowerCase()}) i zamienimy noc w dzień.`,
    cta: { href: `${ROUTES.offices}#formularz`, label: "Program partnerski" },
    icon: "M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  },
] as const;

/** Sekcja „Dla kogo” – 4 grupy klientów z konkretną korzyścią. */
export function AudienceCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {AUDIENCES.map((audience, index) => (
        <li key={audience.title}>
          <Reveal delay={index * 80} className="h-full">
            <article className="card flex h-full flex-col p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-light text-sand-dark">
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" focusable="false">
                  <path d={audience.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{audience.title}</h3>
              <p className="mt-1 text-sm font-semibold text-brand">{audience.benefit}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{audience.text}</p>
              <Link href={audience.cta.href} className="link mt-4 text-sm">
                {audience.cta.label}
                <span aria-hidden="true">&nbsp;→</span>
              </Link>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
