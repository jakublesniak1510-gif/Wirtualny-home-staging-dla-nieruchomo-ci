import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PriceTable } from "@/components/PriceTable";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Steps } from "@/components/Steps";
import type { Step } from "@/components/Steps";
import { StyleCard } from "@/components/StyleCard";
import { OrganizationJsonLd } from "@/components/JsonLd";
import { FAQ_HOME } from "@/content/faq";
import { PORTFOLIO } from "@/content/portfolio";
import { HAS_PLACEHOLDER_TESTIMONIALS, TESTIMONIALS } from "@/content/testimonials";
import { formatPLNShort, formatPhotoCount } from "@/lib/format";
import {
  BULK_THRESHOLD,
  FREE_SAMPLE_PHOTOS,
  MAX_PHOTOS,
  OFFICE_PLAN,
  OFFICE_PLAN_APPROX_NET_PER_PHOTO,
  PRICE_BULK,
  PRICE_SINGLE,
  REFERRAL_REWARD_PHOTOS,
} from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";
import { STYLES, getStyleName } from "@/lib/styles";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const HERO = PORTFOLIO[0];
const GALLERY = PORTFOLIO.slice(1, 5);

const STEPS: readonly Step[] = [
  {
    title: "Wgraj zdjęcia",
    description: `Od 1 do ${MAX_PHOTOS} zdjęć pustych pomieszczeń prosto z telefonu lub aparatu – JPG, PNG lub WebP.`,
  },
  {
    title: "Wybierz styl i dodatki",
    description: `${STYLES.length} stylów do wyboru. W razie potrzeby usuniemy stare meble, odświeżymy ściany lub zamienimy noc w dzień.`,
  },
  {
    title: "Zapłać BLIK-iem",
    description: "Albo kartą czy Przelewy24. Od razu widzisz cenę – bez wycen i czekania na ofertę.",
  },
  {
    title: `Odbierz w ${SITE.turnaroundHours} h`,
    description: `Gotowe wizualizacje pobierzesz z linku w e-mailu. W ekspresie – nawet w ${SITE.expressHours} h.`,
  },
];

const STATS = [
  { value: `${SITE.turnaroundHours} h`, label: "na gotowe wizualizacje" },
  { value: String(STYLES.length), label: "stylów aranżacji do wyboru" },
  { value: `od ${formatPLNShort(PRICE_BULK)}`, label: `za zdjęcie przy ${BULK_THRESHOLD}+ zdjęciach` },
  { value: formatPhotoCount(FREE_SAMPLE_PHOTOS), label: "gratis na próbę dla agentów" },
] as const;

const BENEFITS = [
  {
    title: "Ogłoszenie, które zatrzymuje wzrok",
    text: "Puste pokoje wyglądają na zdjęciach na mniejsze i zimne. Umeblowane wnętrze pomaga kupującym wyobrazić sobie życie w tym miejscu.",
  },
  {
    title: "Ułamek kosztu tradycyjnego stagingu",
    text: `Bez wynajmu i transportu mebli, bez ekipy i terminów. Płacisz ${formatPLNShort(PRICE_SINGLE)} za zdjęcie, a przy większych zamówieniach jeszcze mniej.`,
  },
  {
    title: "Uczciwie wobec kupujących",
    text: "Każde zdjęcie oznaczamy napisem „wizualizacja”. Nie ukrywamy wad lokalu i nie zmieniamy jego metrażu – pokazujemy potencjał, nie iluzję.",
  },
] as const;

const HONESTY_RULES = [
  "Każda wizualizacja ma w rogu dyskretny napis „wizualizacja”.",
  "Nie usuwamy pęknięć, zacieków ani innych wad i nie zmieniamy metrażu, układu czy widoku z okna.",
  "Zalecamy publikowanie w ogłoszeniu również zdjęcia oryginalnego.",
  "Pracujemy wyłącznie na zdjęciach, do których masz prawa.",
] as const;

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-5 w-5 shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <path
        d="m4 10.5 4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      {/* HERO */}
      <section aria-labelledby="hero-title" className="overflow-hidden pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-20">
        <div className="container-x grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <Badge tone="sand">Wirtualny home staging dla nieruchomości</Badge>
            <h1
              id="hero-title"
              className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
            >
              {SITE.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Wgraj zdjęcia pustego mieszkania, wybierz styl, zapłać BLIK-iem – a my w&nbsp;
              {SITE.turnaroundHours}&nbsp;h odeślemy umeblowane wizualizacje gotowe do ogłoszenia. Od{" "}
              <strong className="font-semibold text-ink">{formatPLNShort(PRICE_BULK)}</strong> za zdjęcie.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.order} className="btn-primary px-6 text-base">
                Zamów wizualizację
              </Link>
              <Link href={ROUTES.freeSample} className="btn-secondary px-6 text-base">
                Wypróbuj za darmo
              </Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-ink/85 sm:grid-cols-2">
              {[
                `Gotowe w ${SITE.turnaroundHours} h, ekspres w ${SITE.expressHours} h`,
                "BLIK, karta, Przelewy24",
                "Faktura VAT dla firm",
                "Oznaczenie „wizualizacja” na każdym zdjęciu",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckIcon className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <figure>
            <BeforeAfterSlider
              beforeSrc={HERO.beforeSrc}
              afterSrc={HERO.afterSrc}
              beforeAlt={HERO.beforeAlt}
              afterAlt={HERO.afterAlt}
              label={`Porównanie przed i po: ${HERO.title.toLowerCase()}, styl ${getStyleName(HERO.slug).toLowerCase()}`}
              initial={45}
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
            />
            <figcaption className="mt-3 text-center text-sm text-muted">
              Przesuń suwak, aby porównać. {HERO.room}, {HERO.area}&nbsp;m², styl{" "}
              {getStyleName(HERO.slug).toLowerCase()} (ilustracja poglądowa).
            </figcaption>
          </figure>
        </div>
      </section>

      {/* LICZBY / ZAUFANIE */}
      <section aria-label="Najważniejsze fakty" className="border-y border-line bg-surface">
        <div className="container-x">
          <dl className="grid grid-cols-2 divide-line py-8 lg:grid-cols-4 lg:divide-x">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse px-4 py-3 text-center">
                <dt className="mt-1 text-sm text-muted">{stat.label}</dt>
                <dd className="text-2xl font-semibold text-brand sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* KORZYŚCI */}
      <Section labelledBy="korzysci-title">
        <SectionHeading
          id="korzysci-title"
          eyebrow="Dlaczego warto"
          title="Sprzedawaj i wynajmuj szybciej – bez przestawiania ani jednego mebla"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="card p-6">
              <h3 className="text-lg font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* JAK TO DZIAŁA */}
      <Section id="jak-to-dziala" tone="cream" labelledBy="jak-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="jak-title"
            eyebrow="Jak to działa"
            title="Cztery kroki, zero formalności"
            description="Całe zamówienie złożysz w kilka minut – także z telefonu, prosto po sesji zdjęciowej."
          />
          <Link href={ROUTES.howItWorks} className="link shrink-0 text-sm">
            Szczegóły i wskazówki do zdjęć →
          </Link>
        </div>
        <Steps steps={STEPS} className="mt-10" />
      </Section>

      {/* STYLE */}
      <Section id="style" labelledBy="style-title">
        <SectionHeading
          id="style-title"
          eyebrow="Style aranżacji"
          title={`${STYLES.length} stylów dopasowanych do nieruchomości i kupującego`}
          description="Nie wiesz, który wybrać? Dla mieszkań w blokach najczęściej sprawdza się styl skandynawski, dla kamienic – klasyczny lub loft. Chętnie doradzimy."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STYLES.map((style) => (
            <StyleCard key={style.slug} style={style} />
          ))}
        </div>
      </Section>

      {/* PORTFOLIO */}
      <Section id="portfolio" tone="surface" labelledBy="portfolio-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="portfolio-title"
            eyebrow="Portfolio"
            title="Przed i po – przesuń i porównaj"
            description="Ten sam pokój, te same ściany, okna i podłoga. Dodajemy tylko meble i dekoracje. Poniżej ilustracje poglądowe."
          />
          <Link href={ROUTES.portfolio} className="link shrink-0 text-sm">
            Zobacz całe portfolio →
          </Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {GALLERY.map((item) => (
            <figure key={item.slug}>
              <BeforeAfterSlider
                beforeSrc={item.beforeSrc}
                afterSrc={item.afterSrc}
                beforeAlt={item.beforeAlt}
                afterAlt={item.afterAlt}
                label={`Porównanie przed i po: ${item.title.toLowerCase()}, styl ${getStyleName(item.slug).toLowerCase()}`}
                sizes="(min-width: 768px) 560px, 100vw"
              />
              <figcaption className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                  <Badge tone="neutral">{getStyleName(item.slug)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {item.room} · {item.area}&nbsp;m² — {item.description}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* UCZCIWOŚĆ */}
      <Section tone="cream" labelledBy="uczciwosc-title">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            id="uczciwosc-title"
            eyebrow="Uczciwa wizualizacja"
            title="Pokazujemy potencjał mieszkania, a nie iluzję"
            description="Wirtualny staging ma pomóc kupującym wyobrazić sobie wnętrze – nie wprowadzać ich w błąd. Dlatego przestrzegamy prostych zasad, a przy zamówieniu prosimy Cię o to samo."
          />
          <ul className="card divide-y divide-line">
            {HONESTY_RULES.map((rule) => (
              <li key={rule} className="flex gap-3 p-5 text-sm leading-relaxed text-ink">
                <CheckIcon className="text-brand" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* CENNIK */}
      <Section id="cennik" labelledBy="cennik-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="cennik-title"
            eyebrow="Cennik"
            title="Prosto i przejrzyście"
            description={`Cena zależy tylko od liczby zdjęć. Od ${formatPhotoCount(BULK_THRESHOLD)} w zamówieniu każde kosztuje ${formatPLNShort(PRICE_BULK)} zamiast ${formatPLNShort(PRICE_SINGLE)} – automatycznie.`}
          />
          <Link href={ROUTES.pricing} className="link shrink-0 text-sm">
            Pełny cennik i przykłady →
          </Link>
        </div>
        <PriceTable className="mt-10" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={ROUTES.order} className="btn-primary">
            Policz cenę i zamów
          </Link>
          <Link href={ROUTES.freeSample} className="btn-secondary">
            Najpierw {formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis
          </Link>
        </div>
      </Section>

      {/* DLA BIUR */}
      <Section id="dla-biur" tone="brand" labelledBy="biura-title">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              id="biura-title"
              eyebrow="Dla biur nieruchomości"
              title="Abonament dla zespołów, które publikują dużo ogłoszeń"
              description="Stała miesięczna cena, priorytetowa realizacja i dodatki w cenie. Rozliczenie na fakturę VAT."
              inverted
            />
            <ul className="mt-8 space-y-3 text-white/90">
              {[
                `${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie dla całego zespołu`,
                `Priorytet – gotowe do ${OFFICE_PLAN.priorityHours} h`,
                "Usunięcie mebli, wirtualny remont i noc → dzień w cenie",
                `Program poleceń: ${formatPhotoCount(REFERRAL_REWARD_PHOTOS)} gratis za każdego nowego klienta`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckIcon className="text-sand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card bg-white p-8 text-ink shadow-lift">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">Abonament</p>
            <p className="mt-4">
              <span className="text-5xl font-semibold tracking-tight">
                {formatPLNShort(OFFICE_PLAN.monthlyNet)}
              </span>{" "}
              <span className="text-muted">netto / mies.</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {formatPhotoCount(OFFICE_PLAN.photosPerMonth)} – ok. {formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)}{" "}
              netto za zdjęcie
            </p>
            <Link href={ROUTES.offices} className="btn-primary mt-8 w-full">
              Zapytaj o abonament
            </Link>
            <p className="mt-4 text-center text-xs text-muted">
              Wolisz płacić za zdjęcia? Przygotujemy dla Was pakiet na kod przedpłacony.
            </p>
          </div>
        </div>
      </Section>

      {/* OPINIE */}
      <Section id="opinie" labelledBy="opinie-title">
        <SectionHeading
          id="opinie-title"
          eyebrow="Opinie"
          title="Co mówią agenci i sprzedający"
          align="center"
          description={HAS_PLACEHOLDER_TESTIMONIALS ? "Przykładowe opinie – wkrótce zastąpimy je opiniami naszych klientów." : undefined}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.author} className="card flex flex-col p-6">
              <svg viewBox="0 0 32 24" className="h-6 w-8 text-sand" aria-hidden="true" focusable="false">
                <path
                  d="M0 24V14C0 6 4 1 12 0l1 4c-4 1-6 4-6 8h6v12H0Zm19 0V14c0-8 4-13 12-14l1 4c-4 1-6 4-6 8h6v12H19Z"
                  fill="currentColor"
                />
              </svg>
              <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-ink">
                <p>„{testimonial.quote}”</p>
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4 text-sm">
                <span className="block font-semibold text-ink">{testimonial.author}</span>
                <span className="text-muted">
                  {testimonial.role}, {testimonial.city}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" tone="cream" labelledBy="faq-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading
              id="faq-title"
              eyebrow="FAQ"
              title="Najczęstsze pytania"
              description="Nie znalazłeś odpowiedzi? Napisz do nas – odpowiadamy w dni robocze zwykle w ciągu kilku godzin."
            />
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <Link href={ROUTES.faq} className="link">
                Wszystkie pytania i odpowiedzi →
              </Link>
              <a href={`mailto:${SITE.email}`} className="link">
                {SITE.email}
              </a>
            </div>
          </div>
          <FaqAccordion items={FAQ_HOME} openFirst />
        </div>
      </Section>

      {/* CTA */}
      <section aria-labelledby="cta-title" className="py-16 sm:py-20">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-card bg-brand px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-16">
            <h2 id="cta-title" className="mx-auto max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
              Pokaż kupującym, jak może wyglądać ich nowe mieszkanie
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Wgraj zdjęcia teraz – gotowe wizualizacje dostaniesz w ciągu {SITE.turnaroundHours} godzin.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={ROUTES.order}
                className="btn-primary bg-white px-6 text-base text-brand hover:bg-brand-light"
              >
                Zamów wizualizację
              </Link>
              <Link
                href={ROUTES.freeSample}
                className="btn-secondary border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10"
              >
                {formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
