import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { PaymentStatusPoller } from "@/components/order/PaymentStatusPoller";
import { RetryPaymentButton } from "@/components/order/RetryPaymentButton";
import { StatusTimeline } from "@/components/order/StatusTimeline";
import { prisma } from "@/lib/db";
import { orderFileUrl } from "@/lib/file-access";
import { formatDateTimePL, formatPLN, formatPhotoCount } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  downloadFileName,
  getDeadline,
  getOrderNumber,
  isRevisionWindowOpen,
  parseAddons,
} from "@/lib/orders";
import { INCLUDED_REVISIONS, REVISION_WINDOW_DAYS, getAddon } from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";
import { getStorage } from "@/lib/storage";
import { getStyleName } from "@/lib/styles";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status zamówienia",
  robots: { index: false, follow: false },
};

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

export default async function OrderStatusPage({ params, searchParams }: PageProps<"/zamowienie/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) notFound();

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!order) notFound();

  const number = getOrderNumber(order.id);
  const addons = parseAddons(order.addons);
  const deadline = getDeadline(order);
  const paymentReturn = query.platnosc === "ok";
  const unpaid = order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";
  const filesAvailable = !order.filesDeletedAt;
  const resultsCount = order.photos.filter((p) => p.resultKey).length;
  const storage = getStorage();
  const resultLinks = new Map<string, string>();
  if (filesAvailable) {
    for (const [index, photo] of order.photos.entries()) {
      if (photo.resultKey) {
        resultLinks.set(
          photo.id,
          await storage.getSignedOrProxyUrl(photo.resultKey, {
            token,
            downloadName: downloadFileName(number, index, "wizualizacja", photo.resultKey),
          }),
        );
      }
    }
  }
  const revisionOpen = isRevisionWindowOpen(order.deliveredAt);
  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(`Poprawka – zamówienie ${number}`)}&body=${encodeURIComponent(
    `Dzień dobry,\n\nproszę o poprawkę w zamówieniu ${number}.\n\nNumer zdjęcia: \nCo zmienić: \n\nPozdrawiam`,
  )}`;

  return (
    <div className="container-x py-10 sm:py-14">
      {paymentReturn && (
        <div className="mb-8 rounded-card border border-brand/30 bg-brand-light p-5" role="status">
          <p className="font-semibold text-brand">
            Dziękujemy! Płatność BLIK/P24 może potwierdzać się do kilku minut; status odświeży się automatycznie.
          </p>
          <PaymentStatusPoller token={token} active={unpaid} />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={order.status === "CANCELLED" ? "neutral" : "brand"}>
            {order.isSample ? "Darmowa próbka" : "Zamówienie"} · {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Zamówienie {number}</h1>
          <p className="mt-2 text-sm text-muted">Złożone {formatDateTimePL(order.createdAt)}</p>
        </div>
        {resultsCount > 0 && filesAvailable && (
          <a href={`/api/orders/${token}/download`} className="btn-primary" download>
            Pobierz wszystkie (ZIP)
          </a>
        )}
      </div>

      <div className="card mt-8 p-5 sm:p-7">
        {order.status === "CANCELLED" ? (
          <p className="text-sm font-medium text-danger">
            To zamówienie zostało anulowane{order.paymentStatus === "UNPAID" ? " (brak płatności)" : ""}. W razie pytań
            napisz na <a className="link" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
        ) : (
          <StatusTimeline status={order.status} />
        )}
        {unpaid && !paymentReturn && (
          <div className="mt-6 flex flex-col gap-3 rounded-control bg-sand-light p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink">
              Czekamy na płatność. Realizację zaczniemy zaraz po jej zaksięgowaniu.
            </p>
            {isStripeConfigured() && <RetryPaymentButton token={token} />}
          </div>
        )}
        {!unpaid && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
          <p className="mt-6 text-sm text-ink/80">
            Planowany termin: <strong>{formatDateTimePL(deadline)}</strong>. Gdy wizualizacje będą gotowe, wyślemy e-mail na{" "}
            {order.email}.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="zdjecia-title">
          <h2 id="zdjecia-title" className="text-xl font-semibold text-ink">
            Zdjęcia ({order.photos.length})
          </h2>
          {!filesAvailable && (
            <p className="mt-3 rounded-control bg-cream p-4 text-sm text-muted">
              Pliki tego zamówienia zostały usunięte po 30 dniach od realizacji, zgodnie z polityką prywatności.
            </p>
          )}
          {filesAvailable && (
            <ul className="mt-4 space-y-4">
              {order.photos.map((photo, index) => {
                const download = resultLinks.get(photo.id);
                return (
                  <li key={photo.id} className="card grid gap-4 p-4 sm:grid-cols-2">
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-cream">
                        <Image
                          src={orderFileUrl(photo.originalKey, token, { width: 800 })}
                          alt={`Zdjęcie ${index + 1} – oryginał`}
                          fill
                          unoptimized
                          sizes="(min-width: 640px) 320px, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <figcaption className="mt-2 text-xs text-muted">
                        {index + 1}. Oryginał · {photo.originalName}
                      </figcaption>
                    </figure>
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-cream">
                        {photo.resultKey ? (
                          <Image
                            src={orderFileUrl(photo.resultKey, token, { width: 800 })}
                            alt={`Zdjęcie ${index + 1} – wizualizacja`}
                            fill
                            unoptimized
                            sizes="(min-width: 640px) 320px, 100vw"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">
                            {order.status === "CANCELLED" ? "—" : "Wizualizacja w przygotowaniu"}
                          </div>
                        )}
                      </div>
                      <figcaption className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                        <span>Wizualizacja</span>
                        {download && (
                          <a href={download} className="btn-secondary min-h-9 px-3 py-1.5 text-sm" download>
                            Pobierz
                          </a>
                        )}
                      </figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-ink">Szczegóły</h2>
            <dl className="mt-2 divide-y divide-line/70">
              <Detail label="Liczba zdjęć">{formatPhotoCount(order.photoCount)}</Detail>
              <Detail label="Styl">{getStyleName(order.style)}</Detail>
              <Detail label="Dodatki">{addons.length > 0 ? addons.map((a) => getAddon(a).name).join(", ") : "—"}</Detail>
              <Detail label="Realizacja">{order.isSample ? "24–48 h" : order.express ? `Ekspres (${SITE.expressHours} h)` : `${SITE.turnaroundHours} h`}</Detail>
              <Detail label="Kwota">{order.isSample ? "Gratis" : formatPLN(order.totalAmount)}</Detail>
              <Detail label="Płatność">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Detail>
              {order.paidAt && <Detail label="Termin">{formatDateTimePL(deadline)}</Detail>}
              {order.deliveredAt && <Detail label="Dostarczono">{formatDateTimePL(order.deliveredAt)}</Detail>}
            </dl>
            {order.notes && (
              <div className="mt-3 rounded-control bg-cream p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Uwagi</p>
                <p className="mt-1 whitespace-pre-line text-ink">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-ink">Poprawki</h2>
            <p className="mt-2 text-sm text-muted">
              W cenie każdego zdjęcia masz {INCLUDED_REVISIONS} bezpłatną poprawkę – zgłoś ją w ciągu{" "}
              {REVISION_WINDOW_DAYS} dni od dostarczenia.
            </p>
            {(order.status === "DELIVERED" || order.status === "READY") && (
              <a href={mailto} className={`mt-4 w-full ${revisionOpen || order.status === "READY" ? "btn-primary" : "btn-secondary"}`}>
                Zgłoś poprawkę
              </a>
            )}
          </div>

          <p className="px-1 text-xs text-muted">
            Każda wizualizacja ma znak „wizualizacja”. Publikując ją, pokaż również zdjęcie oryginalne. Masz pytania?{" "}
            <Link href={ROUTES.contact} className="link">
              Napisz do nas
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
