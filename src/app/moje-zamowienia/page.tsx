import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { MagicLinkForm } from "@/components/order/MagicLinkForm";
import { prisma } from "@/lib/db";
import { formatDatePL, formatDateTimePL, formatPLN, formatPhotoCount } from "@/lib/format";
import { MAGIC_LINK_TTL_MINUTES, getClientSessionEmail } from "@/lib/magic-link";
import { ORDER_STATUS_LABELS, getOrderNumber, isExpired } from "@/lib/orders";
import { ROUTES } from "@/lib/site";
import { getStyleName } from "@/lib/styles";
import { logoutClient } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moje zamówienia",
  description: "Wszystkie Twoje zamówienia i kody pakietów w jednym miejscu – logowanie linkiem z e-maila, bez hasła.",
  robots: { index: false, follow: false },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MyOrdersPage({ searchParams }: PageProps<"/moje-zamowienia">) {
  const query = await searchParams;
  const email = await getClientSessionEmail();

  if (!email) {
    const invalidLink = first(query.link) === "niewazny";
    const loggedOut = first(query.wylogowano) === "1";
    return (
      <div className="container-x py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <h1 className="text-3xl font-semibold text-ink">Moje zamówienia</h1>
          <p className="mt-3 text-muted">
            Bez zakładania konta i hasła: podaj e-mail, którego użyłeś(-aś) przy zamówieniu, a wyślemy jednorazowy link
            logowania (ważny {MAGIC_LINK_TTL_MINUTES} minut).
          </p>
          {invalidLink && (
            <p className="mt-4 rounded-control bg-sand-light p-3 text-sm text-ink" role="alert">
              Ten link wygasł lub został już użyty. Wyślij sobie nowy poniżej.
            </p>
          )}
          {loggedOut && (
            <p className="mt-4 rounded-control bg-brand-light p-3 text-sm text-brand" role="status">
              Wylogowano. Do zobaczenia!
            </p>
          )}
          <div className="card mt-6 p-6">
            <MagicLinkForm />
          </div>
          <p className="mt-4 text-xs text-muted">
            Link do konkretnego zamówienia znajdziesz też w e-mailu z potwierdzeniem.{" "}
            <Link href={ROUTES.order} className="link">
              Złóż nowe zamówienie
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const [orders, codes] = await Promise.all([
    prisma.order.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        publicToken: true,
        createdAt: true,
        status: true,
        photoCount: true,
        totalAmount: true,
        isSample: true,
        style: true,
      },
    }),
    prisma.packageCode.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, creditsLeft: true, creditsTotal: true, expiresAt: true },
    }),
  ]);
  const now = new Date();

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Moje zamówienia</h1>
          <p className="mt-2 text-sm text-muted">
            Zalogowano jako <strong className="text-ink">{email}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.order} className="btn-primary">
            Nowe zamówienie
          </Link>
          <form action={logoutClient}>
            <button type="submit" className="btn-secondary">
              Wyloguj
            </button>
          </form>
        </div>
      </div>

      <section aria-labelledby="lista-zamowien" className="mt-8">
        <h2 id="lista-zamowien" className="text-xl font-semibold text-ink">
          Zamówienia ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nie mamy jeszcze zamówień na ten adres.</p>
        ) : (
          <ul className="mt-4 grid gap-3" data-testid="my-orders">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={ROUTES.orderStatus(order.publicToken)}
                  className="card flex flex-col gap-3 p-4 transition hover:border-brand sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-ink">
                      {getOrderNumber(order.id)}
                      {order.isSample && <span className="ml-2 text-xs font-medium text-sand-dark">darmowa próbka</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatDateTimePL(order.createdAt)} · {formatPhotoCount(order.photoCount)} ·{" "}
                      {getStyleName(order.style)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className="text-sm font-medium text-ink">
                      {order.isSample ? "Gratis" : formatPLN(order.totalAmount)}
                    </span>
                    <Badge
                      tone={
                        order.status === "CANCELLED"
                          ? "neutral"
                          : order.status === "READY" || order.status === "DELIVERED"
                            ? "solid"
                            : "brand"
                      }
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <span className="text-brand" aria-hidden="true">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="kody-pakietow" className="mt-10">
        <h2 id="kody-pakietow" className="text-xl font-semibold text-ink">
          Kody pakietów
        </h2>
        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Brak kodów przypisanych do tego adresu. Kody dostajesz m.in. za polecenia albo kupując pakiet dla biura.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="my-codes">
            {codes.map((code) => {
              const expired = isExpired(code.expiresAt, now);
              const usable = !expired && code.creditsLeft > 0;
              return (
                <li key={code.id} className="card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-lg font-semibold tracking-wider text-ink">{code.code}</p>
                    <Badge tone={usable ? "brand" : "neutral"}>
                      {expired ? "Wygasł" : code.creditsLeft > 0 ? "Aktywny" : "Wykorzystany"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink">
                    Pozostało: <strong>{formatPhotoCount(code.creditsLeft)}</strong> z {code.creditsTotal}
                  </p>
                  {code.expiresAt && (
                    <p className="mt-0.5 text-xs text-muted">Ważny do {formatDatePL(code.expiresAt)}</p>
                  )}
                  {usable && (
                    <Link href={`${ROUTES.order}?kod=${encodeURIComponent(code.code)}`} className="link mt-2 inline-block text-sm">
                      Użyj w kreatorze
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
