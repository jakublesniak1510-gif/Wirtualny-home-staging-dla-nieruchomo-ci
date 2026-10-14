import Link from "next/link";
import { Badge } from "@/components/Badge";
import { CheckIcon } from "@/components/CheckIcon";
import { CtaBanner } from "@/components/CtaBanner";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PageHeader } from "@/components/PageHeader";
import { PriceTable } from "@/components/PriceTable";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { getFaqByCategory } from "@/content/faq";
import { VARIANTS_PER_PHOTO } from "@/content/service";
import { formatPLN, formatPLNShort, formatPhotoCount } from "@/lib/format";
import {
  ADDONS,
  BULK_THRESHOLD,
  EXPRESS_RATE,
  FREE_SAMPLE_PHOTOS,
  INCLUDED_REVISIONS,
  MAX_PHOTOS,
  OFFICE_PLAN,
  OFFICE_PLAN_APPROX_NET_PER_PHOTO,
  PRICE_BULK,
  PRICE_SINGLE,
  REVISION_WINDOW_DAYS,
  calculateOrderPrice,
  getAddon,
  netToGross,
} from "@/lib/pricing";
import type { AddonSlug, PriceInput } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Cennik wirtualnego home stagingu",
  description: `Wirtualny home staging od ${formatPLNShort(PRICE_BULK)} za zdjęcie. ${formatPLNShort(PRICE_SINGLE)} za pojedyncze zdjęcie, od ${BULK_THRESHOLD} zdjęć taniej, dodatki, ekspres w ${SITE.expressHours} h i abonament dla biur. Ceny brutto, faktura VAT, BLIK.`,
  path: ROUTES.pricing,
});

interface Scenario {
  title: string;
  description: string;
  input: PriceInput;
}

const SCENARIOS: readonly Scenario[] = [
  {
    title: "Jedno ogłoszenie",
    description: "Kawalerka lub małe mieszkanie – salon, sypialnia i kuchnia z dwóch ujęć.",
    input: { photoCount: 4 },
  },
  {
    title: "Mieszkanie po poprzednich lokatorach",
    description: "Najpierw cyfrowo usuwamy stare meble, potem urządzamy wnętrza od nowa.",
    input: { photoCount: 6, addons: ["usuniecie-mebli"] },
  },
  {
    title: "Pilna sprzedaż – cała oferta w ekspresie",
    description: `Duże mieszkanie lub dom, zdjęcia potrzebne jeszcze dziś – gotowe do ${SITE.expressHours} h.`,
    input: { photoCount: BULK_THRESHOLD, express: true },
  },
  {
    title: "Mieszkanie do odświeżenia",
    description: "Usunięcie mebli i wirtualny remont: nowe ściany i podłoga, potem aranżacja.",
    input: { photoCount: 3, addons: ["usuniecie-mebli", "wirtualny-remont"] },
  },
  {
    title: "Zamówienie z kodem pakietu",
    description: "Biuro ma kod przedpłacony – kredyty pokrywają zdjęcia, dodatki płaci się osobno.",
    input: { photoCount: 5, addons: ["noc-dzien"], packageCredits: 5 },
  },
];

const INCLUDED = [
  {
    title: `${VARIANTS_PER_PHOTO.min}–${VARIANTS_PER_PHOTO.max} warianty aranżacji`,
    text: `Dla każdego zdjęcia generujemy od ${VARIANTS_PER_PHOTO.min} do ${VARIANTS_PER_PHOTO.max} propozycji w wybranym stylu.`,
  },
  {
    title: "Wybór najlepszego",
    text: "Człowiek – nie automat – wybiera wariant, który najlepiej pasuje do proporcji i światła wnętrza.",
  },
  {
    title: "Ręczny retusz",
    text: "Poprawiamy proporcje mebli, cienie, odbicia i krawędzie, żeby wizualizacja wyglądała naturalnie.",
  },
  {
    title: `${INCLUDED_REVISIONS} poprawka gratis`,
    text: `Zgłoś ją w ciągu ${REVISION_WINDOW_DAYS} dni od dostarczenia – np. inny kolor sofy czy mniej dekoracji.`,
  },
  {
    title: "Oznaczenie „wizualizacja”",
    text: "Dyskretny napis na każdym zdjęciu – uczciwie wobec kupujących i zgodnie z regulaminami portali.",
  },
  {
    title: "Pełna rozdzielczość i faktura",
    text: "Pliki gotowe do ogłoszenia i druku, a na firmę – faktura VAT wysyłana e-mailem.",
  },
] as const;

function addonLabel(slug: AddonSlug) {
  return getAddon(slug).name.toLowerCase();
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const price = calculateOrderPrice(scenario.input);
  const rows: { label: string; value: string; muted?: boolean }[] = [
    {
      label: `${formatPhotoCount(price.photoCount)} × ${formatPLNShort(price.unitPrice)}${price.bulkApplied ? ` (cena od ${BULK_THRESHOLD} zdjęć)` : ""}`,
      value: formatPLN(price.base),
    },
  ];
  for (const slug of price.addonSlugs) {
    const addon = getAddon(slug);
    rows.push({
      label: `${addon.name}: ${formatPhotoCount(price.photoCount)} × ${formatPLNShort(addon.pricePerPhoto)}`,
      value: formatPLN(addon.pricePerPhoto * price.photoCount),
    });
  }
  if (price.express > 0) {
    rows.push({
      label: `Ekspres: +${Math.round(EXPRESS_RATE * 100)}% ceny bazowej`,
      value: formatPLN(price.express),
    });
  }
  if (price.creditsUsed > 0) {
    rows.push({
      label: `Kod pakietu: ${formatPhotoCount(price.creditsUsed)} z puli`,
      value: `−${formatPLN(price.discount)}`,
    });
  }

  return (
    <article className="card flex flex-col p-6">
      <h3 className="text-lg font-semibold text-ink">{scenario.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{scenario.description}</p>
      <dl className="mt-5 flex-1 space-y-2 border-t border-line pt-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <dt className="text-muted">{row.label}</dt>
            <dd className="whitespace-nowrap text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 border-t border-line pt-4">
        <p className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-semibold text-ink">Do zapłaty brutto</span>
          <span className="text-2xl font-semibold tracking-tight text-brand">{formatPLN(price.total)}</span>
        </p>
        <p className="mt-1 text-right text-xs text-muted">
          {formatPLN(price.net)} netto · średnio {formatPLN(price.perPhoto)} za zdjęcie
        </p>
      </div>
    </article>
  );
}

export default function PricingPage() {
  const expressExample = calculateOrderPrice({ photoCount: 4, express: true });
  const packageAddon = calculateOrderPrice({ photoCount: 1, addons: ["usuniecie-mebli"], packageCredits: 1 });
  const pricingFaq = getFaqByCategory("ceny");

  return (
    <>
      <PageHeader
        eyebrow="Cennik"
        title="Płacisz za zdjęcie – bez abonamentu i ukrytych opłat"
        description={
          <>
            <p>
              {formatPLNShort(PRICE_SINGLE)} za zdjęcie, a od {formatPhotoCount(BULK_THRESHOLD)} w zamówieniu – tylko{" "}
              {formatPLNShort(PRICE_BULK)} za każde. Ceny brutto (z VAT), obok podajemy kwoty netto. Płacisz BLIK-iem,
              kartą lub Przelewy24, a fakturę VAT dostajesz e-mailem.
            </p>
          </>
        }
        actions={
          <>
            <Link href={ROUTES.order} className="btn-primary px-6 text-base">
              Policz cenę i zamów
            </Link>
            <Link href={ROUTES.freeSample} className="btn-secondary px-6 text-base">
              {formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę
            </Link>
          </>
        }
      />

      <Section labelledBy="ceny-title">
        <SectionHeading
          id="ceny-title"
          eyebrow="Ceny i dodatki"
          title="Cena zależy od liczby zdjęć w zamówieniu"
          description={`Zamawiasz od ${formatPhotoCount(1)} do ${formatPhotoCount(MAX_PHOTOS)} naraz. Próg ${BULK_THRESHOLD} zdjęć liczymy w ramach jednego zamówienia – niższa cena nalicza się sama, bez kodów rabatowych.`}
        />
        <PriceTable variant="full" examples={[1, 5, BULK_THRESHOLD, MAX_PHOTOS]} className="mt-10" />
      </Section>

      <Section tone="cream" labelledBy="wyliczenia-title">
        <SectionHeading
          id="wyliczenia-title"
          eyebrow="Przykładowe zamówienia"
          title="Ile zapłacisz w typowych sytuacjach"
          description="Wyliczenia pochodzą z tego samego kalkulatora, który liczy cenę w formularzu zamówienia."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard key={scenario.title} scenario={scenario} />
          ))}
          <div className="card flex flex-col justify-between border-dashed bg-transparent p-6 shadow-none">
            <div>
              <h3 className="text-lg font-semibold text-ink">Jak liczymy ekspres?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Dopłata to {Math.round(EXPRESS_RATE * 100)}% ceny bazowej całego zamówienia (bez dodatków). Przykład:{" "}
                {formatPhotoCount(expressExample.photoCount)} to {formatPLN(expressExample.base)} + ekspres{" "}
                {formatPLN(expressExample.express)} = {formatPLN(expressExample.total)}. Gotowe do{" "}
                {SITE.expressHours}&nbsp;h zamiast {SITE.turnaroundHours}&nbsp;h.
              </p>
            </div>
            <Link href={ROUTES.order} className="link mt-5 text-sm">
              Policz swoje zamówienie →
            </Link>
          </div>
        </div>
      </Section>

      <Section labelledBy="w-cenie-title">
        <SectionHeading
          id="w-cenie-title"
          eyebrow="Co obejmuje cena"
          title="Za każdym zdjęciem stoi wybór i ręczna praca"
          description="Nie sprzedajemy surowych generacji z automatu. W cenie każdego zdjęcia jest cały proces – od wariantów po retusz."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((item) => (
            <li key={item.title} className="card flex gap-3 p-6">
              <CheckIcon className="mt-0.5 text-brand" />
              <div>
                <h3 className="font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Zdjęcie nie nadaje się do obróbki (jest za ciemne albo rozmyte)? Napiszemy przed rozpoczęciem pracy – możesz
          przesłać inne ujęcie albo odzyskać pieniądze za to zdjęcie.
        </p>
      </Section>

      <Section tone="surface" labelledBy="pakiety-title">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card flex flex-col p-6 sm:p-8">
            <Badge tone="sand" className="self-start">
              Dla zespołów
            </Badge>
            <h2 id="pakiety-title" className="mt-4 text-2xl font-semibold text-ink">
              Pakiety na kod przedpłacony
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Kupujesz pulę zdjęć z góry, a my wysyłamy kod, z którego może korzystać cały zespół. Każdy agent wpisuje
              go w formularzu zamówienia – system sam odejmuje wykorzystane zdjęcia.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              {[
                "1 kredyt = 1 zdjęcie bazowe w dowolnym stylu",
                `Kredyt w pakiecie od ${formatPhotoCount(BULK_THRESHOLD)} kosztuje tyle, co zdjęcie w zamówieniu hurtowym – ${formatPLNShort(PRICE_BULK)} brutto`,
                `Dodatki i ekspres płatne osobno – np. ${addonLabel("usuniecie-mebli")} przy zdjęciu z kodu: ${formatPLN(packageAddon.total)}`,
                "Jedna faktura VAT za cały pakiet",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Link href={`${ROUTES.offices}#formularz`} className="btn-secondary">
                Zapytaj o pakiet
              </Link>
            </div>
          </div>

          <div className="card relative flex flex-col border-brand p-6 ring-1 ring-brand sm:p-8">
            <Badge tone="solid" className="self-start">
              Abonament dla biur
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-ink">
              {formatPhotoCount(OFFICE_PLAN.photosPerMonth)} co miesiąc
            </h2>
            <p className="mt-4">
              <span className="text-4xl font-semibold tracking-tight text-ink">
                {formatPLNShort(OFFICE_PLAN.monthlyNet)}
              </span>{" "}
              <span className="text-sm text-muted">netto / mies.</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatPLN(netToGross(OFFICE_PLAN.monthlyNet))} brutto · ok.{" "}
              {formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)} netto za zdjęcie
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              {[
                `Priorytet – gotowe do ${OFFICE_PLAN.priorityHours} h`,
                `Wszystkie dodatki w cenie: ${ADDONS.map((addon) => addon.name.toLowerCase()).join(", ")}`,
                "Faktura VAT raz w miesiącu",
                "Jeden kontakt dla całego zespołu",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
              <Link href={ROUTES.offices} className="btn-primary">
                Poznaj ofertę dla biur
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="cream" labelledBy="faq-ceny-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading
              id="faq-ceny-title"
              eyebrow="Pytania o ceny"
              title="Płatności, faktury i rabaty"
              description="Nie ma tu Twojego pytania? Zajrzyj do pełnego FAQ albo napisz do nas."
            />
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <Link href={ROUTES.faq} className="link">
                Wszystkie pytania i odpowiedzi →
              </Link>
              <Link href={ROUTES.contact} className="link">
                Kontakt →
              </Link>
            </div>
          </div>
          <FaqAccordion items={pricingFaq} openFirst />
        </div>
      </Section>

      <CtaBanner
        title="Sprawdź cenę swojego zamówienia w minutę"
        description="Wgraj zdjęcia, wybierz styl i dodatki – kalkulator od razu pokaże kwotę do zapłaty."
        primary={{ href: ROUTES.order, label: "Zamów wizualizację" }}
        secondary={{ href: ROUTES.offices, label: "Oferta dla biur" }}
      />
    </>
  );
}
