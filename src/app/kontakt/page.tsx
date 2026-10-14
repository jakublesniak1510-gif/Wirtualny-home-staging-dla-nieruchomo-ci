import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { PageHeader } from "@/components/PageHeader";
import { PROVIDER } from "@/content/legal";
import { SUPPORT_HOURS } from "@/content/service";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Kontakt",
  description: `Masz pytanie o wirtualny home staging, zamówienie lub współpracę? Napisz: ${SITE.email}. Odpowiadamy w dni robocze, ${SUPPORT_HOURS.typicalResponse}.`,
  path: ROUTES.contact,
});

const QUICK_LINKS = [
  { href: ROUTES.faq, label: "Najczęstsze pytania (FAQ)" },
  { href: ROUTES.howItWorks, label: "Jak przygotować zdjęcia" },
  { href: ROUTES.offices, label: "Abonament dla biur – osobny formularz" },
  { href: ROUTES.freeSample, label: "Darmowa próbka dla agentów" },
] as const;

export default function ContactPage() {
  const phoneHref = `tel:${SITE.phone.replace(/\s+/g, "")}`;

  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Porozmawiajmy o Twoich zdjęciach"
        description={
          <p>
            Pytanie o zamówienie, styl, fakturę albo współpracę? Napisz przez formularz lub e-mailem – odpowiadamy w dni
            robocze, {SUPPORT_HOURS.typicalResponse}.
          </p>
        }
      />

      <div className="container-x py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink">Dane kontaktowe</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-muted">E-mail</dt>
                  <dd className="mt-0.5">
                    <a href={`mailto:${SITE.email}`} className="link text-base">
                      {SITE.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Telefon</dt>
                  <dd className="mt-0.5">
                    <a href={phoneHref} className="link text-base">
                      {SITE.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Godziny odpowiedzi</dt>
                  <dd className="mt-0.5 text-ink">
                    {SUPPORT_HOURS.days}, {SUPPORT_HOURS.hours}
                    <span className="block text-muted">
                      {SUPPORT_HOURS.typicalResponse}, {SUPPORT_HOURS.maxResponse}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink">Dane firmy</h2>
              <address className="mt-3 text-sm not-italic leading-relaxed text-ink">
                {PROVIDER.legalName}
                <br />
                {PROVIDER.address}
                <br />
                NIP: {PROVIDER.nip}
              </address>
              <p className="mt-3 text-xs text-muted">
                Pytasz o złożone zamówienie? Podaj adres e-mail użyty przy zamówieniu albo wklej link do statusu
                zamówienia – szybciej je odnajdziemy.
              </p>
            </div>

            <nav aria-label="Przydatne linki" className="card bg-cream p-6">
              <h2 className="text-lg font-semibold text-ink">Może tu znajdziesz odpowiedź</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <h2 className="sr-only">Formularz kontaktowy</h2>
            <ContactForm type="contact" />
          </div>
        </div>
      </div>
    </>
  );
}
