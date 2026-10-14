import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LEGAL_NAV, ROUTES, SITE } from "@/lib/site";

const SERVICE_LINKS = [
  { label: "Zamów wizualizację", href: ROUTES.order },
  { label: "Darmowa próbka", href: ROUTES.freeSample },
  { label: "Cennik", href: ROUTES.pricing },
  { label: "Dla biur nieruchomości", href: ROUTES.offices },
] as const;

const INFO_LINKS = [
  { label: "Jak to działa", href: ROUTES.howItWorks },
  { label: "Portfolio", href: ROUTES.portfolio },
  { label: "FAQ", href: ROUTES.faq },
  { label: "Kontakt", href: ROUTES.contact },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/75 hover:text-white hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const phoneHref = `tel:${SITE.phone.replace(/\s+/g, "")}`;

  return (
    <footer className="bg-ink text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">{SITE.tagline}</p>
          <ul className="mt-5 space-y-1.5 text-sm">
            <li>
              <a href={`mailto:${SITE.email}`} className="text-white/90 hover:text-white hover:underline">
                {SITE.email}
              </a>
            </li>
            <li>
              <a href={phoneHref} className="text-white/90 hover:text-white hover:underline">
                {SITE.phone}
              </a>
            </li>
          </ul>
        </div>

        <FooterColumn title="Usługa" links={SERVICE_LINKS} />
        <FooterColumn title="Informacje" links={INFO_LINKS} />

        <div>
          <h2 className="text-sm font-semibold text-white">Dokumenty i firma</h2>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/75 hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <address className="mt-5 text-sm not-italic leading-relaxed text-white/75">
            {SITE.company.legalName}
            <br />
            {SITE.company.address}
            <br />
            NIP: {SITE.company.nip}
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. Wszystkie wizualizacje oznaczamy napisem „wizualizacja”.
          </p>
          <p>Płatności: BLIK, karta, Przelewy24 – obsługiwane przez Stripe.</p>
        </div>
      </div>
    </footer>
  );
}
