import Link from "next/link";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { CheckIcon, CrossIcon } from "@/components/CheckIcon";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { PORTFOLIO } from "@/content/portfolio";
import {
  ACCEPTED_FORMATS_TEXT,
  MAX_UPLOAD_MB_TEXT,
  MIN_PHOTO_SHORT_SIDE_PX,
  RECOMMENDED_PHOTO_LONG_SIDE_PX,
  VARIANTS_PER_PHOTO,
} from "@/content/service";
import { formatPhotoCount } from "@/lib/format";
import {
  ADDONS,
  EXPRESS_RATE,
  FREE_SAMPLE_PHOTOS,
  INCLUDED_REVISIONS,
  MAX_PHOTOS,
  MIN_PHOTOS,
  OFFICE_PLAN,
  REVISION_WINDOW_DAYS,
  getAddon,
} from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";
import { STYLES, getStyleName } from "@/lib/styles";

export const metadata = pageMetadata({
  title: "Jak to działa – wirtualny home staging krok po kroku",
  description: `Wgraj ${MIN_PHOTOS}–${MAX_PHOTOS} zdjęć, wybierz styl, zapłać BLIK-iem i odbierz wizualizacje w ${SITE.turnaroundHours} h. Zobacz, jak fotografować puste wnętrza, co możemy zmienić, a czego nie robimy.`,
  path: ROUTES.howItWorks,
});

const EXAMPLE = PORTFOLIO.find((item) => item.slug === "nowoczesny") ?? PORTFOLIO[0];

const DETAILED_STEPS = [
  {
    title: "Wgraj zdjęcia pustych pomieszczeń",
    lead: `Od ${MIN_PHOTOS} do ${MAX_PHOTOS} zdjęć w jednym zamówieniu – prosto z telefonu, aparatu albo od fotografa.`,
    points: [
      `Pliki ${ACCEPTED_FORMATS_TEXT}, do ${MAX_UPLOAD_MB_TEXT} MB każdy.`,
      "Nie musisz niczego retuszować ani kadrować.",
      "Potwierdzasz, że masz prawa do zdjęć (np. sam je zrobiłeś albo masz zgodę fotografa).",
    ],
  },
  {
    title: "Wybierz styl i dodatki",
    lead: `${STYLES.length} stylów: ${STYLES.map((style) => style.name.toLowerCase()).join(", ")}.`,
    points: [
      ...ADDONS.map((addon) => `${addon.name} – ${addon.description.charAt(0).toLowerCase()}${addon.description.slice(1)}`),
      `Ekspres – gotowe do ${SITE.expressHours} h (dopłata ${Math.round(EXPRESS_RATE * 100)}% ceny bazowej).`,
    ],
  },
  {
    title: "Zapłać BLIK-iem, kartą lub Przelewy24",
    lead: "Cenę widzisz od razu w formularzu – bez wycen i czekania na ofertę.",
    points: [
      "Płatności obsługuje Stripe – nie widzimy ani nie przechowujemy danych Twojej karty.",
      "Masz kod pakietu od biura? Wpisz go, a zdjęcia zostaną opłacone z puli.",
      "Na firmę wystawiamy fakturę VAT – wystarczy podać NIP.",
    ],
  },
  {
    title: `Odbierz wizualizacje w ${SITE.turnaroundHours} h`,
    lead: `Dla każdego zdjęcia generujemy ${VARIANTS_PER_PHOTO.min}–${VARIANTS_PER_PHOTO.max} warianty, wybieramy najlepszy i ręcznie go poprawiamy.`,
    points: [
      "Link do pobrania przyjdzie e-mailem; status zamówienia sprawdzisz w każdej chwili.",
      "Każde zdjęcie ma dyskretny napis „wizualizacja”.",
      `${INCLUDED_REVISIONS} bezpłatna poprawka w ciągu ${REVISION_WINDOW_DAYS} dni od dostarczenia.`,
    ],
  },
] as const;

const PHOTO_TIPS = [
  {
    title: "Poziomo i prosto",
    text: "Trzymaj telefon poziomo, na wysokości ok. 1,2–1,5 m. Pionowe linie ścian powinny być pionowe – pomaga siatka w aparacie.",
  },
  {
    title: "Obiektyw szerokokątny",
    text: "Użyj trybu 0,5× lub obiektywu szerokokątnego i stań w rogu pokoju. W kadrze powinna być podłoga i co najmniej dwie ściany.",
  },
  {
    title: "Światło dzienne",
    text: `Fotografuj w dzień, z odsłoniętymi oknami i zapalonym światłem. Unikaj fotografowania pod słońce. Zdjęcie po zmroku? Pomoże dodatek „${getAddon("noc-dzien").name}”.`,
  },
  {
    title: "Pusto i czysto",
    text: "Usuń z kadru drobiazgi, kartony i osobiste rzeczy – dokumenty, zdjęcia rodzinne. Większe meble usuniemy cyfrowo za dopłatą.",
  },
] as const;

const REQUIREMENTS = [
  { term: "Format", detail: ACCEPTED_FORMATS_TEXT },
  { term: "Rozmiar pliku", detail: `do ${MAX_UPLOAD_MB_TEXT} MB na zdjęcie` },
  {
    term: "Rozdzielczość",
    detail: `min. ${MIN_PHOTO_SHORT_SIDE_PX} px na krótszym boku, najlepiej ${RECOMMENDED_PHOTO_LONG_SIDE_PX} px i więcej na dłuższym`,
  },
  { term: "Orientacja", detail: "pozioma (najlepiej 3:2 lub 4:3)" },
  { term: "Liczba zdjęć", detail: `${MIN_PHOTOS}–${MAX_PHOTOS} w jednym zamówieniu` },
] as const;

const WE_DO = [
  "Dodajemy meble, dywany, oświetlenie, rośliny i dekoracje w wybranym stylu.",
  "Usuwamy stare meble i przedmioty (dodatek).",
  `Zmieniamy wykończenie: kolor ścian, rodzaj podłogi (dodatek „${getAddon("wirtualny-remont").name}”).`,
  "Zamieniamy zdjęcie wieczorne lub pochmurne na jasne, dzienne (dodatek).",
  "Dopasowujemy perspektywę, cienie i światło, żeby całość wyglądała naturalnie.",
] as const;

const WE_DONT = [
  "Nie ukrywamy wad: pęknięć, zacieków, wilgoci, grzyba, uszkodzeń instalacji.",
  "Nie zmieniamy metrażu ani proporcji pomieszczeń.",
  "Nie przesuwamy, nie dodajemy ani nie usuwamy okien, drzwi i ścian – układ zostaje taki jak w rzeczywistości.",
  "Nie zmieniamy widoku za oknem ani otoczenia budynku.",
  "Nie usuwamy elementów stałych, które zostają w lokalu (np. grzejników, pionów, skosów).",
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Jak to działa"
        title="Od pustego pokoju do umeblowanego zdjęcia w cztery kroki"
        description={
          <p>
            Zamówienie złożysz w kilka minut, także z telefonu. Poniżej wszystko, co warto wiedzieć: jak zrobić dobre
            zdjęcie, co możemy zmienić we wnętrzu, a czego – ze względu na uczciwość wobec kupujących – nie robimy.
          </p>
        }
        actions={
          <>
            <Link href={ROUTES.order} className="btn-primary px-6 text-base">
              Zamów wizualizację
            </Link>
            <Link href={ROUTES.freeSample} className="btn-secondary px-6 text-base">
              {formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę
            </Link>
          </>
        }
      />

      <Section labelledBy="kroki-title">
        <SectionHeading id="kroki-title" eyebrow="Krok po kroku" title="Cztery kroki, zero formalności" />
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {DETAILED_STEPS.map((step, index) => (
            <li key={step.title} className="card flex gap-4 p-6 sm:p-8">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-base font-semibold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  <span className="sr-only">Krok {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/85">{step.lead}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {step.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <CheckIcon className="h-4 w-4 translate-y-0.5 text-brand" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface" labelledBy="przyklad-title">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            id="przyklad-title"
            eyebrow="Przykład"
            title="Ten sam pokój – tylko z meblami"
            description={
              <>
                <p>
                  Ściany, okna, podłoga i metraż zostają bez zmian. Dodajemy wyłącznie wyposażenie, które pomaga
                  kupującym wyobrazić sobie życie w tym miejscu.
                </p>
                <p className="mt-3 text-sm">
                  {EXAMPLE.room}, {EXAMPLE.area}&nbsp;m², styl {getStyleName(EXAMPLE.slug).toLowerCase()} – ilustracja
                  poglądowa.{" "}
                  <Link href={ROUTES.portfolio} className="link">
                    Zobacz całe portfolio
                  </Link>
                </p>
              </>
            }
          />
          <BeforeAfterSlider
            beforeSrc={EXAMPLE.beforeSrc}
            afterSrc={EXAMPLE.afterSrc}
            beforeAlt={EXAMPLE.beforeAlt}
            afterAlt={EXAMPLE.afterAlt}
            label={`Porównanie przed i po: ${EXAMPLE.title.toLowerCase()}`}
            sizes="(min-width: 1024px) 600px, 100vw"
          />
        </div>
      </Section>

      <Section id="zdjecia" labelledBy="zdjecia-title">
        <SectionHeading
          id="zdjecia-title"
          eyebrow="Wskazówki"
          title="Jak sfotografować puste mieszkanie"
          description="Lepsze zdjęcie wejściowe to lepsza wizualizacja. Wystarczy telefon – trzymaj się czterech zasad."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {PHOTO_TIPS.map((tip, index) => (
              <li key={tip.title} className="card p-6">
                <p className="text-sm font-semibold text-sand-dark" aria-hidden="true">
                  0{index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{tip.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{tip.text}</p>
              </li>
            ))}
          </ul>
          <div className="card self-start bg-cream p-6">
            <h3 className="text-lg font-semibold text-ink">Wymagania techniczne</h3>
            <dl className="mt-4 divide-y divide-line text-sm">
              {REQUIREMENTS.map((item) => (
                <div key={item.term} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="font-medium text-ink">{item.term}</dt>
                  <dd className="text-muted sm:text-right">{item.detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Zdjęcie zbyt ciemne, rozmyte albo bez podłogi w kadrze? Napiszemy przed rozpoczęciem pracy – możesz
              przesłać inne ujęcie albo odzyskać pieniądze za to zdjęcie.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="cream" id="co-robimy" labelledBy="zakres-title">
        <SectionHeading
          id="zakres-title"
          eyebrow="Uczciwa wizualizacja"
          title="Co możemy zmienić, a czego nie robimy"
          description="Wirtualny home staging pokazuje potencjał wnętrza. Nie może wprowadzać kupujących w błąd co do stanu i wielkości lokalu – dlatego trzymamy się jasnych zasad."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-brand">Robimy</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink">
              {WE_DO.map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckIcon className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-danger">Nie robimy</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink">
              {WE_DONT.map((item) => (
                <li key={item} className="flex gap-3">
                  <CrossIcon className="text-danger" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section labelledBy="terminy-title">
        <SectionHeading id="terminy-title" eyebrow="Terminy i poprawki" title="Ile to trwa i co, jeśli coś nie pasuje" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Czas realizacji</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Standard</dt>
                <dd className="font-semibold text-ink">do {SITE.turnaroundHours}&nbsp;h</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Ekspres (+{Math.round(EXPRESS_RATE * 100)}%)</dt>
                <dd className="font-semibold text-ink">do {SITE.expressHours}&nbsp;h</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Abonament dla biur</dt>
                <dd className="font-semibold text-ink">do {OFFICE_PLAN.priorityHours}&nbsp;h</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Czas liczymy od zaksięgowania płatności. Zamówienia opłacone w weekend lub święto realizujemy w pierwszej
              kolejności następnego dnia roboczego.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Poprawki</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Każde zdjęcie obejmuje {INCLUDED_REVISIONS} bezpłatną poprawkę zgłoszoną w ciągu {REVISION_WINDOW_DAYS}{" "}
              dni od dostarczenia: inny kolor sofy, inne ustawienie mebli, mniej dekoracji, usunięcie elementu.
              Wystarczy odpisać na e-mail z gotowymi zdjęciami.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Zmiana stylu całej aranżacji to nowe zamówienie – ale zawsze doradzimy, który styl wybrać.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Oznaczenie „wizualizacja”</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Każde gotowe zdjęcie ma w rogu dyskretny, półprzezroczysty napis „wizualizacja”, nakładany automatycznie.
              Nie usuwaj go – chroni Ciebie i kupujących przed nieporozumieniami.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Zalecamy publikowanie w ogłoszeniu również zdjęcia oryginalnego, np. jako kolejnego w galerii.
            </p>
          </div>
        </div>
      </Section>

      <CtaBanner
        title="Masz już zdjęcia? Zamów pierwsze wizualizacje"
        description={`Gotowe w ciągu ${SITE.turnaroundHours} godzin – albo sprawdź nas najpierw na darmowej próbce.`}
        primary={{ href: ROUTES.order, label: "Zamów wizualizację" }}
        secondary={{ href: ROUTES.pricing, label: "Zobacz cennik" }}
      />
    </>
  );
}
