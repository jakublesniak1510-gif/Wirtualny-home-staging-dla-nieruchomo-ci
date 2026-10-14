import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE, getSiteUrl } from "@/lib/site";
import "./globals.css";

const defaultTitle = `${SITE.name} – wirtualny home staging w ${SITE.turnaroundHours} h`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "wirtualny home staging",
    "home staging",
    "wizualizacja mieszkania",
    "zdjęcia do ogłoszenia",
    "aranżacja pustego mieszkania",
    "nieruchomości",
  ],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: defaultTitle,
    description: SITE.description,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} – ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE.description,
    images: ["/og.png"],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1f4d3a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className="h-full">
      <body className="flex min-h-full flex-col">
        <a
          href="#tresc"
          className="sr-only z-50 rounded-lg bg-brand px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Przejdź do treści
        </a>
        <Header />
        <main id="tresc" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
