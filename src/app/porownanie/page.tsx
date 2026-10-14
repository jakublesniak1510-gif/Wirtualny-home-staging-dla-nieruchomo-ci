import Link from "next/link";
import { CheckIcon } from "@/components/CheckIcon";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Breadcrumbs } from "@/components/marketing/Breadcrumbs";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { Reveal } from "@/components/marketing/Reveal";
import { SavingsCalculator } from "@/components/marketing/SavingsCalculator";
import { COMPARISON_OPTIONS, WHEN_TO_CHOOSE } from "@/content/comparison";
import { MARKET_SOURCE_NOTE, PHYSICAL_STAGING_COST } from "@/content/market";
import { formatPLNShort, formatPhotoCount } from "@/lib/format";
import { FREE_SAMPLE_PHOTOS, PRICE_BULK } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Wirtualny home staging – porównanie z fizycznym stagingiem, AI i agencją",
  description: `Uczciwe porównanie: wirtualny staging od ${formatPLNShort(PRICE_BULK)} za zdjęcie vs fizyczny home staging (${formatPLNShort(PHYSICAL_STAGING_COST.min)}–${formatPLNShort(PHYSICAL_STAGING_COST.max)}), narzędzia AI „zrób to sam” i agencje graficzne. Cena, czas, jakość, faktura VAT, BLIK.`,
  path: ROUTES.comparison,
});

const OUR_EDGE = [
  "Człowiek sprawdza i poprawia każde zdjęcie – nie dostajesz surowej generacji z błędami.",
  "Wszystko po polsku: obsługa, faktura VAT, płatność BLIK – bez przeliczania walut.",
  "Oznaczenie „wizualizacja” nakładane automatycznie i zasady, które chronią przed zarzutem wprowadzania w błąd.",
  `Gotowe w ${SITE.turnaroundHours} h, ekspres w ${SITE.expressHours} h – szybciej niż agencja, bez Twojej pracy przy generowaniu.`,
] as const;

export default function ComparisonPage() {
  return (
    <>
      <PageHeader
        eyebrow="Porównanie"
        title="Wirtualny staging czy coś innego? Uczciwe porównanie"
        breadcrumbs={<Breadcrumbs items={[{ name: "Porównanie", path: ROUTES.comparison }]} />}
        description={
          <p>
            Umeblowane zdjęcia możesz zdobyć na cztery sposoby. Porównujemy je bez nazw konkretnych firm – kategoriami
            usług, na podstawie orientacyjnych cen rynkowych. Każda opcja ma sens w innej sytuacji.
          </p>
        }
      />

      <Section labelledBy="tabela-title">
        <SectionHeading
          id="tabela-title"
          eyebrow="Tabela"
          title="Porównanie krok po kroku"
          description="Na telefonie przewiń tabelę w bok. Ceny alternatyw to szacunki – rzeczywisty koszt zależy od zakresu i dostawcy."
        />
        <ComparisonTable
          className="mt-10"
          caption="Porównanie: wirtualny staging, fizyczny home staging, narzędzia AI „zrób to sam” i agencja graficzna"
        />
        <p className="mt-4 text-xs leading-relaxed text-muted">{MARKET_SOURCE_NOTE}</p>
      </Section>

      <Section tone="cream" labelledBy="kiedy-title">
        <SectionHeading
          id="kiedy-title"
          eyebrow="Kiedy co wybrać"
          title="Nie zawsze my – i to w porządku"
          description="Jeśli lepiej sprawdzi się inna opcja, powiemy Ci to wprost. Oto krótka ściągawka."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {COMPARISON_OPTIONS.map((option, index) => (
            <li key={option.id}>
              <Reveal delay={index * 70} className="h-full">
                <article className={`card h-full p-6 ${option.id === "my" ? "border-brand ring-1 ring-brand" : ""}`}>
                  <h3 className="text-lg font-semibold text-ink">{option.name}</h3>
                  <p className="text-xs text-muted">{option.note}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/85">{WHEN_TO_CHOOSE[option.id]}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="przewaga-title">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            id="przewaga-title"
            eyebrow="Nasza przewaga"
            title="Szybkość aplikacji, jakość agencji, cena dla każdego"
            description="Łączymy generowanie AI z ręczną kontrolą i retuszem. Ty tylko wgrywasz zdjęcia i płacisz BLIK-iem."
          />
          <ul className="card divide-y divide-line">
            {OUR_EDGE.map((item) => (
              <li key={item} className="flex gap-3 p-5 text-sm leading-relaxed text-ink">
                <CheckIcon className="text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="surface" id="oszczednosc" labelledBy="oszczednosc-title">
        <SectionHeading
          id="oszczednosc-title"
          eyebrow="Policz oszczędność"
          title="Ile kosztuje Twój scenariusz?"
          description="Porównaj miesięczny koszt wirtualnego stagingu z orientacyjną ceną fizycznego home stagingu."
        />
        <div className="mt-10">
          <SavingsCalculator labelledBy="oszczednosc-title" />
        </div>
        <p className="mt-6 text-sm text-muted">
          Szczegóły cen znajdziesz w{" "}
          <Link href={ROUTES.pricing} className="link">
            cenniku
          </Link>
          , a zasady uczciwej wizualizacji – na stronie{" "}
          <Link href={`${ROUTES.howItWorks}#co-robimy`} className="link">
            jak to działa
          </Link>
          .
        </p>
      </Section>

      <CtaBanner
        title="Sprawdź różnicę na własnym zdjęciu"
        description={`Wyślij jedno zdjęcie pustego pokoju – przygotujemy wizualizację gratis i ocenisz jakość sam.`}
        primary={{ href: ROUTES.freeSample, label: `${formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę` }}
        secondary={{ href: ROUTES.order, label: "Zamów wizualizacje" }}
      />
    </>
  );
}
