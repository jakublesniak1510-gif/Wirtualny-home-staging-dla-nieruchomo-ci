import Link from "next/link";
import { CtaBanner } from "@/components/CtaBanner";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd, faqPageJsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { FAQ, FAQ_CATEGORIES, getFaqByCategory } from "@/content/faq";
import { SUPPORT_HOURS } from "@/content/service";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "FAQ – najczęstsze pytania o wirtualny home staging",
  description:
    "Ile trwa wizualizacja, jakie zdjęcia przesłać, jak płacić BLIK-iem, czy wizualizacja jest oznaczona i czego nie zmieniamy. Odpowiedzi na najczęstsze pytania.",
  path: ROUTES.faq,
});

const GROUPS = FAQ_CATEGORIES.map((category) => ({
  ...category,
  items: getFaqByCategory(category.slug),
})).filter((group) => group.items.length > 0);

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FAQ)} />
      <PageHeader
        eyebrow="FAQ"
        title="Najczęstsze pytania"
        description={
          <p>
            Wszystko o zamawianiu, terminach, płatnościach i zasadach uczciwej wizualizacji. Nie znalazłeś odpowiedzi?{" "}
            <Link href={ROUTES.contact} className="link">
              Napisz do nas
            </Link>
            .
          </p>
        }
      />

      <div className="container-x py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
          <nav aria-label="Kategorie pytań" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-semibold text-ink">Kategorie</p>
            <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {GROUPS.map((group) => (
                <li key={group.slug}>
                  <a
                    href={`#${group.slug}`}
                    className="inline-flex rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink/80 hover:border-brand hover:text-brand lg:rounded-lg lg:border-transparent lg:bg-transparent lg:px-2"
                  >
                    {group.label}
                    <span className="ml-1.5 text-muted">({group.items.length})</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-12">
            {GROUPS.map((group) => (
              <section key={group.slug} id={group.slug} aria-labelledby={`${group.slug}-tytul`}>
                <h2 id={`${group.slug}-tytul`} className="text-2xl font-semibold text-ink">
                  {group.label}
                </h2>
                <FaqAccordion items={group.items} className="mt-5" />
              </section>
            ))}

            <div className="card bg-cream p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-ink">Nadal masz pytanie?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Odpowiadamy w dni robocze ({SUPPORT_HOURS.days}, {SUPPORT_HOURS.hours}), {SUPPORT_HOURS.typicalResponse}.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href={ROUTES.contact} className="btn-primary">
                  Napisz do nas
                </Link>
                <a href={`mailto:${SITE.email}`} className="btn-secondary">
                  {SITE.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CtaBanner
        title="Wszystko jasne? Zamów pierwsze wizualizacje"
        primary={{ href: ROUTES.order, label: "Zamów wizualizację" }}
        secondary={{ href: ROUTES.pricing, label: "Zobacz cennik" }}
      />
    </>
  );
}
