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

export interface BreadcrumbItem {
  name: string;
  /** Ścieżka, np. ROUTES.blog. */
  path: string;
}

/** BreadcrumbList – ścieżka okruszków (Strona główna → … → bieżąca strona). */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLdData {
  const all: readonly BreadcrumbItem[] = [{ name: "Strona główna", path: ROUTES.home }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Okruszki jako JSON-LD (bez widocznego elementu) – <BreadcrumbJsonLd items={[{ name: "Cennik", path: ROUTES.pricing }]} />. */
export function BreadcrumbJsonLd({ items }: { items: readonly BreadcrumbItem[] }) {
  return <JsonLd data={breadcrumbJsonLd(items)} />;
}

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  path: string;
  /** RRRR-MM-DD */
  publishedAt: string;
  updatedAt?: string;
  imagePath: string;
  section?: string;
  keywords?: readonly string[];
  wordCount?: number;
}

/** Article (BlogPosting) – do strony artykułu. */
export function articleJsonLd(input: ArticleJsonLdInput): JsonLdData {
  const siteUrl = getSiteUrl();
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#artykul`,
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    inLanguage: "pl-PL",
    image: [absoluteUrl(input.imagePath), absoluteUrl("/og.png")],
    author: { "@type": "Organization", name: SITE.name, url: `${siteUrl}/` },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organizacja`,
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords && input.keywords.length > 0 ? { keywords: input.keywords.join(", ") } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
  };
}
