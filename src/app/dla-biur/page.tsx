import Link from "next/link";
import { Badge } from "@/components/Badge";
import { CheckIcon } from "@/components/CheckIcon";
import { ContactForm } from "@/components/ContactForm";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/marketing/Breadcrumbs";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Steps } from "@/components/Steps";
import type { Step } from "@/components/Steps";
import { getFaqByCategory } from "@/content/faq";
import { PARTNER_DISCOUNT_RATE } from "@/content/service";
import { formatPLN, formatPLNShort, formatPhotoCount, pluralizePL } from "@/lib/format";
import {
  ADDONS,
  OFFICE_PLAN,
  OFFICE_PLAN_APPROX_NET_PER_PHOTO,
  PRICE_SINGLE,
  REFERRAL_REWARD_PHOTOS,
  calculateOrderPrice,
  getAddon,
  isAddonSlug,
  netToGross,
} from "@/lib/pricing";
import type { PriceInput } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Abonament dla biur nieruchomości i deweloperów",
  description: `Wirtualny home staging w abonamencie: ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie za ${formatPLNShort(OFFICE_PLAN.monthlyNet)} netto, dodatki w cenie, priorytet ${OFFICE_PLAN.priorityHours} h i faktura VAT. Oferta dla biur, deweloperów i fotografów.`,
  path: ROUTES.offices,
});

const addonNames = ADDONS.map((addon) => addon.name.toLowerCase()).join(", ");

const BENEFITS = [
  {
    title: "Przewidywalny koszt",
    text: `Stała kwota ${formatPLNShort(OFFICE_PLAN.monthlyNet)} netto miesięcznie – łatwo wliczyć ją w budżet marketingu biura.`,
  },
  {
    title: `Priorytet ${OFFICE_PLAN.priorityHours} h`,
    text: `Zlecenia z abonamentu realizujemy przed zamówieniami standardowymi – gotowe do ${OFFICE_PLAN.priorityHours} godzin.`,
  },
  {
    title: "Dodatki bez dopłat",
    text: `W cenie: ${addonNames}. Nie liczysz, który dodatek się opłaca.`,
  },
  {
    title: "Jeden kod dla zespołu",
    text: "Każdy agent zamawia samodzielnie przez formularz – bez przekazywania plików przez szefa biura.",
  },
  {
    title: "Spójny wygląd ofert",
    text: "Ustalamy z Wami ulubione style i kolorystykę, żeby ogłoszenia biura były rozpoznawalne.",
  },
  {
    title: "Bezpiecznie dla reputacji",
    text: "Każda wizualizacja ma oznaczenie „wizualizacja”, nie ukrywamy wad i nie zmieniamy metrażu.",
  },
] as const;

interface ComparisonRow {
  label: string;
  /** Liczba zamówień w miesiącu (zdjęcia z abonamentu ÷ zdjęcia w zamówieniu). */
  orders: number;
  input: PriceInput;
}

/** Wiersz porównania: N zamówień po X zdjęć – razem tyle zdjęć, ile w abonamencie. */
function comparisonRow(photosPerOrder: number, addons: PriceInput["addons"] = []): ComparisonRow {
  const orders = Math.ceil(OFFICE_PLAN.photosPerMonth / photosPerOrder);
  const addonText =
    addons && addons.length > 0
      ? ` z dodatkiem „${addons.map((slug) => (isAddonSlug(slug) ? getAddon(slug).name.toLowerCase() : slug)).join("”, „")}”`
      : ", bez dodatków";
  return {
    label: `${orders}\u00a0${pluralizePL(orders, ["zamówienie", "zamówienia", "zamówień"])} po ${formatPhotoCount(photosPerOrder)}${addonText}`,
    orders,
    input: { photoCount: photosPerOrder, addons },
  };
}

const COMPARISON: readonly ComparisonRow[] = [
  comparisonRow(10),
  comparisonRow(5),
  comparisonRow(5, ["usuniecie-mebli"]),
];

const FEATURES_COMPARED = [
  { label: "Czas realizacji", single: `do ${SITE.turnaroundHours} h`, plan: `do ${OFFICE_PLAN.priorityHours} h (priorytet)` },
  { label: "Dodatki", single: "płatne za każde zdjęcie", plan: "w cenie abonamentu" },
  { label: "Rozliczenie", single: "płatność przy każdym zamówieniu", plan: "jedna faktura VAT miesięcznie" },
  { label: "Dla zespołu", single: "każdy agent płaci osobno", plan: "wspólny kod dla całego biura" },
] as const;

const STEPS: readonly Step[] = [
  {
    title: "Wypełnij formularz",
    description: "Napisz, ile ofert publikujecie miesięcznie. Odezwiemy się w ciągu jednego dnia roboczego.",
  },
  {
    title: "Krótka rozmowa i próbka",
    description: "Ustalamy style, sposób zamawiania i dane do faktury. Na start robimy bezpłatną próbkę na Waszym zdjęciu.",
  },
  {
    title: "Kod i faktura",
    description: `Dostajecie kod zespołu na ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} w miesiącu i fakturę VAT. Na życzenie podpisujemy umowę powierzenia danych.`,
  },
  {
    title: "Zamawiacie, my dowozimy",
    description: `Agenci składają zlecenia z kodem, dodatki zaznaczają w uwagach – bez dopłat. Gotowe do ${OFFICE_PLAN.priorityHours} h.`,
  },
];

export default function OfficesPage() {
  const planGross = netToGross(OFFICE_PLAN.monthlyNet);
  const partnerPrice = Math.round(PRICE_SINGLE * (1 - PARTNER_DISCOUNT_RATE));
  const officeFaq = getFaqByCategory("biura");

  const comparison = COMPARISON.map((row) => {
    const order = calculateOrderPrice(row.input);
    const payNet = order.net * row.orders;
    const payGross = order.total * row.orders;
    return { ...row, payNet, payGross, saving: payNet - OFFICE_PLAN.monthlyNet };
  });

  return (
    <>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ name: "Dla biur", path: ROUTES.offices }]} />}
        eyebrow="Dla biur nieruchomości i deweloperów"
        title="Wirtualny home staging w abonamencie dla całego zespołu"
        description={
          <p>
            Publikujecie kilka ofert tygodniowo? Abonament daje stałą cenę, priorytetową realizację i wszystkie dodatki
            w cenie. Rozliczenie na fakturę VAT – bez płacenia BLIK-iem za każde zlecenie.
          </p>
        }
        actions={
          <>
            <a href="#formularz" className="btn-primary px-6 text-base">
              Zapytaj o abonament
            </a>
            <Link href={ROUTES.freeSample} className="btn-secondary px-6 text-base">
              Najpierw darmowa próbka
            </Link>
          </>
        }
        aside={
          <div className="card p-6 shadow-lift sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">Abonament</p>
            <p className="mt-3">
              <span className="text-5xl font-semibold tracking-tight text-ink">
                {formatPLNShort(OFFICE_PLAN.monthlyNet)}
              </span>{" "}
              <span className="text-muted">netto / mies.</span>
            </p>
            <p className="mt-1 text-xs text-muted">{formatPLN(planGross)} brutto</p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink">
              {[
                `${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie`,
                `ok. ${formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)} netto za zdjęcie`,
                `Priorytet – gotowe do ${OFFICE_PLAN.priorityHours} h`,
                "Wszystkie dodatki w cenie",
                "Faktura VAT co miesiąc",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section labelledBy="korzysci-title">
        <SectionHeading
          id="korzysci-title"
          eyebrow="Korzyści"
          title="Więcej zapytań z ogłoszeń, mniej organizacji"
          description="Umeblowane zdjęcia wyróżniają ofertę na portalach. Abonament sprawia, że zamawianie ich jest tak proste jak wysłanie maila."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="card p-6">
              <h3 className="text-lg font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="cream" labelledBy="porownanie-title">
        <SectionHeading
          id="porownanie-title"
          eyebrow="Porównanie"
          title={`Pojedyncze zamówienia czy abonament? Policzmy ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} w miesiącu`}
          description="Kwoty netto, wyliczone z aktualnego cennika. Zamówienia jednorazowe od 10 zdjęć mają już niższą cenę hurtową – mimo to abonament wychodzi taniej."
        />
        <div className="card mt-10 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">
              Koszt {formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie: pojedyncze zamówienia a abonament (netto)
            </caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="px-6 py-3 font-medium">Jak zamawiacie</th>
                <th scope="col" className="px-6 py-3 font-medium">Pojedyncze zamówienia</th>
                <th scope="col" className="px-6 py-3 font-medium">Abonament</th>
                <th scope="col" className="px-6 py-3 font-medium">Oszczędność</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {comparison.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-6 py-4 align-top font-medium text-ink">{row.label}</th>
                  <td className="px-6 py-4 align-top">
                    <span className="block text-ink">{formatPLN(row.payNet)} netto</span>
                    <span className="block text-xs text-muted">{formatPLN(row.payGross)} brutto</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="block font-semibold text-ink">{formatPLN(OFFICE_PLAN.monthlyNet)} netto</span>
                    <span className="block text-xs text-muted">{formatPLN(planGross)} brutto</span>
                  </td>
                  <td className="px-6 py-4 align-top font-semibold text-brand">
                    {row.saving > 0 ? `${formatPLN(row.saving)} / mies.` : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="px-6 pt-6 text-left text-base font-semibold text-ink">
              Co jeszcze się zmienia
            </caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="px-6 py-3 font-medium"><span className="sr-only">Cecha</span></th>
                <th scope="col" className="px-6 py-3 font-medium">Pojedyncze zamówienia</th>
                <th scope="col" className="px-6 py-3 font-medium">Abonament</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FEATURES_COMPARED.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-6 py-3 font-medium text-ink">{row.label}</th>
                  <td className="px-6 py-3 text-muted">{row.single}</td>
                  <td className="px-6 py-3 font-medium text-ink">{row.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">
          Ceny w zamówieniach jednorazowych są cenami brutto z 23% VAT – w tabeli przeliczyliśmy je na netto, żeby
          porównanie z abonamentem było uczciwe.
        </p>
      </Section>

      <Section labelledBy="wspolpraca-title">
        <SectionHeading
          id="wspolpraca-title"
          eyebrow="Jak wygląda współpraca"
          title="Od formularza do pierwszych zdjęć w kilka dni"
        />
        <Steps steps={STEPS} className="mt-10" />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Faktura VAT</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Abonament fakturujemy z góry, raz w miesiącu, na dane biura. Faktura trafia e-mailem do osoby, którą
              wskażecie – np. do księgowości.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Priorytet {OFFICE_PLAN.priorityHours}&nbsp;h</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Zlecenia z kodu abonamentowego trafiają na początek kolejki. Gotowe wizualizacje dostajecie do{" "}
              {OFFICE_PLAN.priorityHours} godzin, a agent dostaje link do pobrania e-mailem.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Dane i poufność</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Zdjęcia Waszych klientów nie trafiają do naszego portfolio bez zgody. Pliki usuwamy automatycznie po
              realizacji, a na życzenie podpisujemy umowę powierzenia przetwarzania danych.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface" labelledBy="partnerzy-title">
        <h2 id="partnerzy-title" className="sr-only">
          Program poleceń i partnerstwo
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card flex flex-col p-6 sm:p-8">
            <Badge tone="sand" className="self-start">
              Program poleceń
            </Badge>
            <h3 className="mt-4 text-2xl font-semibold text-ink">
              {formatPhotoCount(REFERRAL_REWARD_PHOTOS)} gratis za każde polecenie
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Poleć nas znajomemu agentowi lub innemu biuru. Gdy złoży i opłaci pierwsze zamówienie z Twoim kodem
              polecenia, wyślemy Ci kod na {formatPhotoCount(REFERRAL_REWARD_PHOTOS)} gratis. Liczba poleceń nie jest
              ograniczona.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Kod polecenia to Twój adres e-mail użyty przy pierwszym zamówieniu – poleconą osobę poproś, by wpisała go w
              polu „Kod polecenia”.
            </p>
          </div>
          <div className="card flex flex-col p-6 sm:p-8">
            <Badge tone="brand" className="self-start">
              Dla fotografów nieruchomości
            </Badge>
            <h3 className="mt-4 text-2xl font-semibold text-ink">
              Rabat {Math.round(PARTNER_DISCOUNT_RATE * 100)}% w programie partnerskim
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Robisz zdjęcia dla agentów i deweloperów? Dodaj wirtualny home staging do swojej oferty. Partnerzy płacą
              o {Math.round(PARTNER_DISCOUNT_RATE * 100)}% mniej – np. {formatPLN(partnerPrice)} zamiast{" "}
              {formatPLN(PRICE_SINGLE)} za pojedyncze zdjęcie – i sami ustalają cenę dla swoich klientów.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Pliki oddajemy bez naszego logo (z oznaczeniem „wizualizacja”), więc możesz przekazać je klientowi jako
              część swojej usługi. Napisz w formularzu, że jesteś fotografem.
            </p>
          </div>
        </div>
      </Section>

      <Section id="formularz" tone="cream" labelledBy="formularz-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHeading
              id="formularz-title"
              eyebrow="Zapytanie o ofertę"
              title="Przygotujemy ofertę dla Waszego biura"
              description="Bez zobowiązań. Odpowiadamy w ciągu jednego dnia roboczego – z propozycją abonamentu albo pakietu na kod przedpłacony."
            />
            <ul className="mt-8 space-y-3 text-sm text-ink">
              {[
                "Bezpłatna próbka na Waszym zdjęciu",
                "Abonament lub pakiet – doradzimy, co się bardziej opłaca",
                "Faktura VAT i umowa powierzenia danych",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-muted">
              Wolisz telefon lub e-mail?{" "}
              <a href={`mailto:${SITE.email}`} className="link">
                {SITE.email}
              </a>
            </p>
          </div>
          <ContactForm type="office" />
        </div>
      </Section>

      <Section labelledBy="faq-biura-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading
            id="faq-biura-title"
            eyebrow="FAQ"
            title="Pytania biur i agentów"
            description={
              <>
                Więcej odpowiedzi znajdziesz w{" "}
                <Link href={ROUTES.faq} className="link">
                  pełnym FAQ
                </Link>{" "}
                i{" "}
                <Link href={ROUTES.pricing} className="link">
                  cenniku
                </Link>
                .
              </>
            }
          />
          <FaqAccordion items={officeFaq} openFirst />
        </div>
      </Section>
    </>
  );
}
