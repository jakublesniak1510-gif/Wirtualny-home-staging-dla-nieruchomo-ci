/**
 * Konfiguracja marki – jedyne źródło nazwy, danych kontaktowych i nawigacji.
 * Zmiana nazwy serwisu = zmiana `SITE.name` tutaj.
 */
export const SITE = {
  name: "Wirtualny Staging", // robocza nazwa, łatwa do zmiany
  domain: "wirtualnystaging.pl",
  email: "kontakt@wirtualnystaging.pl",
  phone: "+48 000 000 000",
  tagline: "Puste mieszkanie? Umeblujemy je w 24 h.",
  description:
    "Wirtualny home staging dla nieruchomości: wgraj zdjęcia pustego mieszkania, wybierz styl i w 24 h odbierz umeblowane wizualizacje do ogłoszenia. Od 29 zł za zdjęcie, płatność BLIK.",
  turnaroundHours: 24,
  expressHours: 6,
  /** Dane firmy – placeholdery do podmiany przed startem. */
  company: {
    legalName: "[NAZWA FIRMY]",
    nip: "[NIP]",
    address: "[ADRES]",
  },
  locale: "pl_PL",
} as const;

/** Publiczny adres serwisu (bez końcowego „/”). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = fromEnv && fromEnv.length > 0 ? fromEnv : `https://${SITE.domain}`;
  return url.replace(/\/+$/, "");
}

/** Absolutny URL dla ścieżki, np. absoluteUrl("/zamow"). */
export function absoluteUrl(path = "/"): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Trasy serwisu – używaj zamiast wpisywać ścieżki ręcznie. */
export const ROUTES = {
  home: "/",
  order: "/zamow",
  orderStatus: (token: string) => `/zamowienie/${token}`,
  freeSample: "/darmowa-probka",
  pricing: "/cennik",
  offices: "/dla-biur",
  howItWorks: "/jak-to-dziala",
  portfolio: "/portfolio",
  faq: "/faq",
  contact: "/kontakt",
  terms: "/regulamin",
  privacy: "/polityka-prywatnosci",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  comparison: "/porownanie",
  myOrders: "/moje-zamowienia",
  admin: "/admin",
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Główna nawigacja w nagłówku. */
export const MAIN_NAV: readonly NavItem[] = [
  { label: "Jak to działa", href: ROUTES.howItWorks },
  { label: "Portfolio", href: ROUTES.portfolio },
  { label: "Cennik", href: ROUTES.pricing },
  { label: "Dla biur", href: ROUTES.offices },
  { label: "Blog", href: ROUTES.blog },
  { label: "Kontakt", href: ROUTES.contact },
];

/** Linki prawne w stopce i formularzach. */
export const LEGAL_NAV: readonly NavItem[] = [
  { label: "Regulamin", href: ROUTES.terms },
  { label: "Polityka prywatności", href: ROUTES.privacy },
];
