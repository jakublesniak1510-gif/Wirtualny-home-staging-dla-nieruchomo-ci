import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { FreeSampleForm } from "@/components/order/FreeSampleForm";
import { formatPLNShort } from "@/lib/format";
import { MIN_SHORT_SIDE, getMaxUploadMb } from "@/lib/images";
import { FREE_SAMPLE_PHOTOS, PRICE_BULK } from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";
import { STYLES } from "@/lib/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Darmowa próbka wizualizacji",
  description: `Agent nieruchomości? Sprawdź jakość za darmo – ${FREE_SAMPLE_PHOTOS} zdjęcie gratis, gotowe w 24–48 h.`,
  alternates: { canonical: ROUTES.freeSample },
};

const BENEFITS = [
  {
    title: "Dla kogo?",
    text: "Dla agentów i biur nieruchomości, deweloperów i zarządców najmu, którzy chcą sprawdzić jakość przed pierwszym zamówieniem.",
  },
  {
    title: "Co dostaniesz?",
    text: `${FREE_SAMPLE_PHOTOS} pełnowymiarową wizualizację w wybranym stylu (jeden z ${STYLES.length}), z oznaczeniem „wizualizacja” – gotową do ogłoszenia.`,
  },
  {
    title: "Kiedy?",
    text: "Zwykle w ciągu 24–48 godzin roboczych. Link do pobrania wyślemy e-mailem.",
  },
] as const;

export default function FreeSamplePage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div>
          <Badge tone="sand">Bez płatności, bez zobowiązań</Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Darmowa próbka – {FREE_SAMPLE_PHOTOS} zdjęcie gratis
          </h1>
          <p className="mt-4 text-lg text-muted">
            Wyślij zdjęcie pustego pokoju, a my pokażemy, jak może wyglądać umeblowany. Bez karty i bez BLIK-a.
          </p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((item) => (
              <li key={item.title} className="card p-5">
                <h2 className="font-semibold text-ink">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            Jedna próbka na adres e-mail. Spodobało się? Kolejne zdjęcia już od {formatPLNShort(PRICE_BULK)} –{" "}
            <Link href={ROUTES.pricing} className="link">
              zobacz cennik
            </Link>{" "}
            lub{" "}
            <Link href={ROUTES.order} className="link">
              zamów od razu
            </Link>
            .
          </p>
          <p className="mt-3 text-xs text-muted">
            Masz pytania? {SITE.email} · {SITE.phone}
          </p>
        </div>
        <FreeSampleForm maxMb={getMaxUploadMb()} minShortSide={MIN_SHORT_SIDE} />
      </div>
    </div>
  );
}
