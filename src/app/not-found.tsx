import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center sm:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">Błąd 404</p>
      <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
        Tego pokoju jeszcze nie umeblowaliśmy
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Strona, której szukasz, nie istnieje lub została przeniesiona. Sprawdź adres albo wróć na
        stronę główną.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={ROUTES.home} className="btn-primary">
          Wróć na stronę główną
        </Link>
        <Link href={ROUTES.contact} className="btn-secondary">
          Napisz do nas
        </Link>
      </div>
    </div>
  );
}
