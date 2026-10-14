import Link from "next/link";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHeader } from "@/components/PageHeader";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { formatPhotoCount } from "@/lib/format";
import { FREE_SAMPLE_PHOTOS } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";
import { STYLES } from "@/lib/styles";

export const metadata = pageMetadata({
  title: "Portfolio – wirtualny home staging przed i po",
  description: `Zobacz, jak puste wnętrza zmieniają się po wirtualnym home stagingu. ${STYLES.length} stylów: ${STYLES.map((s) => s.name.toLowerCase()).join(", ")}. Przesuń suwak i porównaj przed i po.`,
  path: ROUTES.portfolio,
});

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Przed i po – przesuń suwak i porównaj"
        description={
          <p>
            Ten sam pokój, te same ściany, okna i podłoga. Dodajemy meble i dekoracje w wybranym stylu – nic więcej.
            Filtruj po stylu, żeby zobaczyć, który najlepiej pasuje do Twojej nieruchomości.
          </p>
        }
      />

      <section aria-label="Galeria realizacji" className="py-12 sm:py-16">
        <div className="container-x">
          {/* Usuń ten dopisek po podmianie ilustracji na prawdziwe realizacje (src/content/portfolio.ts). */}
          <p
            role="note"
            className="mb-8 rounded-control border border-sand/60 bg-sand-light/60 px-4 py-3 text-sm leading-relaxed text-ink"
          >
            <strong className="font-semibold">Ilustracje poglądowe</strong> – wszystkie pary „przed i po” poniżej pokazują zasadę działania usługi i zostaną zastąpione zdjęciami naszych realizacji.
            Chcesz zobaczyć efekt na własnym zdjęciu?{" "}
            <Link href={ROUTES.freeSample} className="link">
              Zamów {formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis
            </Link>
            .
          </p>
          <PortfolioGallery />
        </div>
      </section>

      <CtaBanner
        title="Twoje mieszkanie może być następne"
        description={`Wgraj zdjęcia pustych pomieszczeń i odbierz umeblowane wizualizacje w ciągu ${SITE.turnaroundHours} godzin.`}
        primary={{ href: ROUTES.order, label: "Zamów wizualizację" }}
        secondary={{ href: ROUTES.freeSample, label: `${formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę` }}
      />
    </>
  );
}
