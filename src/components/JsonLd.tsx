import type { FaqItem } from "@/content/faq";
import { isPlaceholderValue } from "@/content/legal";
import { PRICE_BULK, PRICE_SINGLE } from "@/lib/pricing";
import { ROUTES, SITE, absoluteUrl, getSiteUrl } from "@/lib/site";

/** Dowolny obiekt JSON-LD (schema.org). */
export type JsonLdData = { [key: string]: JsonLdValue };
type JsonLdValue = string | number | boolean | null | JsonLdData | readonly JsonLdValue[];

/**
 * Renderuje dane strukturalne schema.org jako <script type="application/ld+json">.
 * Znak „<” zamieniamy na <, żeby treść nie mogła zamknąć tagu <script> (XSS).
 */
export function JsonLd({ data }: { data: JsonLdData | readonly JsonLdData[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const toPLN = (grosze: number) => (grosze / 100).toFixed(2);

/** Organizacja + usługa (ProfessionalService ⊂ LocalBusiness) – do strony głównej. */
export function organizationJsonLd(): JsonLdData {
  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organizacja`;

  const organization: JsonLdData = {
    "@type": "ProfessionalService",
    "@id": orgId,
    name: SITE.name,
    url: `${siteUrl}/`,
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl("/og.png"),
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    areaServed: { "@type": "Country", name: "Polska" },
    priceRange: `${toPLN(PRICE_BULK)}–${toPLN(PRICE_SINGLE)} PLN`,
    currenciesAccepted: "PLN",
    paymentAccepted: "BLIK, karta płatnicza, Przelewy24",
    knowsLanguage: "pl",
    ...(isPlaceholderValue(SITE.company.legalName) ? {} : { legalName: SITE.company.legalName }),
    ...(isPlaceholderValue(SITE.company.nip) ? {} : { taxID: SITE.company.nip }),
    ...(isPlaceholderValue(SITE.company.address)
      ? {}
      : { address: { "@type": "PostalAddress", streetAddress: SITE.company.address, addressCountry: "PL" } }),
  };

  const service: JsonLdData = {
    "@type": "Service",
    "@id": `${siteUrl}/#usluga`,
    name: "Wirtualny home staging",
    serviceType: "Wirtualny home staging – wizualizacje umeblowanych wnętrz do ogłoszeń nieruchomości",
    provider: { "@id": orgId },
    areaServed: { "@type": "Country", name: "Polska" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PLN",
      lowPrice: toPLN(PRICE_BULK),
      highPrice: toPLN(PRICE_SINGLE),
      url: absoluteUrl(ROUTES.pricing),
    },
  };

  return { "@context": "https://schema.org", "@graph": [organization, service] };
}

/** FAQPage – do strony /faq. */
export function faqPageJsonLd(items: readonly FaqItem[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.join("\n\n") },
    })),
  };
}

/** Gotowy blok JSON-LD organizacji – do wpięcia na stronie głównej: <OrganizationJsonLd />. */
export function OrganizationJsonLd() {
  return <JsonLd data={organizationJsonLd()} />;
}
