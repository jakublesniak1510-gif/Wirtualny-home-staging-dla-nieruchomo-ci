import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagicLinkForm } from "@/components/order/MagicLinkForm";
import { MAGIC_LINK_TTL_MINUTES, isMagicLinkValid, isMagicTokenFormat } from "@/lib/magic-link";
import { loginWithMagicLink } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Logowanie do zamówień",
  robots: { index: false, follow: false },
  // Token w adresie nie może wyciec w nagłówku Referer.
  referrer: "no-referrer",
};

/**
 * Strona z jednorazowego linku. Token zużywamy dopiero po kliknięciu przycisku (server action),
 * żeby skanery linków w poczcie (np. Outlook Safe Links) nie „spaliły” go samym otwarciem.
 */
export default async function MagicLinkPage({ params }: PageProps<"/moje-zamowienia/[token]">) {
  const { token } = await params;
  if (!isMagicTokenFormat(token)) notFound();
  const valid = await isMagicLinkValid(token);

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="card mx-auto max-w-md p-6 sm:p-8">
        {valid ? (
          <>
            <h1 className="text-2xl font-semibold text-ink">Twoje zamówienia</h1>
            <p className="mt-2 text-sm text-muted">
              Kliknij, aby zobaczyć zamówienia i kody pakietów. Pozostaniesz zalogowany(-a) na tym urządzeniu przez 24 h.
            </p>
            <form action={loginWithMagicLink.bind(null, token)} className="mt-6">
              <button type="submit" className="btn-primary w-full" data-testid="magic-login">
                Pokaż moje zamówienia
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-ink">Link wygasł lub został już użyty</h1>
            <p className="mt-2 text-sm text-muted">
              Ze względów bezpieczeństwa link działa {MAGIC_LINK_TTL_MINUTES} minut i tylko raz. Wyślij sobie nowy:
            </p>
            <div className="mt-6">
              <MagicLinkForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
