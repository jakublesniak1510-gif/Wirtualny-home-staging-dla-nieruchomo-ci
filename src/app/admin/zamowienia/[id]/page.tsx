import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { OrderActions } from "@/components/admin/OrderActions";
import { ResultUpload } from "@/components/admin/ResultUpload";
import { requireAdmin } from "@/lib/admin-auth";
import { CONSENT_LABELS } from "@/lib/consents";
import type { ConsentKey } from "@/lib/consents";
import { prisma } from "@/lib/db";
import { formatDateTimePL, formatPLN } from "@/lib/format";
import { formatFileSize } from "@/lib/file-size";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  downloadFileName,
  getDeadline,
  getOrderNumber,
  isOverdue,
  parseAddons,
} from "@/lib/orders";
import { getAddon } from "@/lib/pricing";
import type { PriceBreakdown } from "@/lib/pricing";
import { ROUTES } from "@/lib/site";
import { buildProxyUrl } from "@/lib/storage";
import { getStyleName } from "@/lib/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Szczegóły zamówienia" };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-ink">{children}</dd>
    </div>
  );
}

function parseBreakdown(json: string): PriceBreakdown | null {
  try {
    return JSON.parse(json) as PriceBreakdown;
  } catch {
    return null;
  }
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/zamowienia/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } }, packageCode: true },
  });
  if (!order) notFound();

  const number = getOrderNumber(order.id);
  const addons = parseAddons(order.addons);
  const breakdown = parseBreakdown(order.priceBreakdown);
  const results = order.photos.filter((p) => p.resultKey).length;
  const allResultsReady = order.photos.length > 0 && results === order.photos.length;
  const overdue = isOverdue(order);
  const filesAvailable = !order.filesDeletedAt;
  const consents: Record<ConsentKey, boolean> = {
    terms: order.consentTerms,
    digital: order.consentDigital,
    honesty: order.consentHonesty,
    rights: order.consentRights,
  };

  return (
    <div className="container-x py-8">
      <Link href="/admin" className="link text-sm">
        ← Wszystkie zamówienia
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Zamówienie {number}</h1>
        <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">{ORDER_STATUS_LABELS[order.status]}</span>
        {order.isSample && <span className="rounded-full bg-sand-light px-3 py-1 text-xs font-semibold text-sand-dark">Darmowa próbka</span>}
        {order.express && <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">EKSPRES</span>}
      </div>
      <p className={`mt-1 text-sm ${overdue ? "font-semibold text-danger" : "text-muted"}`}>
        Złożone {formatDateTimePL(order.createdAt)} · termin {formatDateTimePL(getDeadline(order))}
        {overdue && " – PO TERMINIE"}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="zdjecia-admin">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="zdjecia-admin" className="text-lg font-semibold text-ink">
              Zdjęcia – wyniki {results}/{order.photos.length}
            </h2>
            {filesAvailable && (
              <a href={`/api/admin/orders/${order.id}/download`} className="btn-secondary min-h-9 py-1.5 text-sm" download>
                Pobierz oryginały (ZIP)
              </a>
            )}
          </div>
          {!filesAvailable && (
            <p className="mt-3 rounded-control bg-cream p-4 text-sm text-muted">
              Pliki usunięte {order.filesDeletedAt ? formatDateTimePL(order.filesDeletedAt) : ""} (sprzątanie po 30 dniach).
            </p>
          )}
          {filesAvailable && (
            <ul className="mt-4 space-y-4">
              {order.photos.map((photo, index) => (
                <li key={photo.id} className="card p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-cream">
                        <Image src={buildProxyUrl(photo.originalKey, { width: 800 })} alt={`Oryginał ${index + 1}`} fill unoptimized sizes="400px" className="object-cover" />
                      </div>
                      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                        <span>
                          {index + 1}. {photo.originalName} · {photo.width}×{photo.height} · {formatFileSize(photo.size)}
                        </span>
                        <a
                          className="link"
                          href={buildProxyUrl(photo.originalKey, { downloadName: downloadFileName(number, index, "oryginal", photo.originalKey) })}
                        >
                          Pobierz oryginał
                        </a>
                      </figcaption>
                    </figure>
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-control border border-dashed border-line bg-paper">
                        {photo.resultKey ? (
                          <Image src={buildProxyUrl(photo.resultKey, { width: 800 })} alt={`Wynik ${index + 1}`} fill unoptimized sizes="400px" className="object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted">Brak wyniku</div>
                        )}
                      </div>
                      <figcaption className="mt-2 flex flex-wrap items-start justify-between gap-2 text-xs text-muted">
                        <span>
                          {photo.resultUploadedAt ? `Wgrano ${formatDateTimePL(photo.resultUploadedAt)}` : "Znak wodny dodamy automatycznie"}
                          {photo.resultKey && (
                            <>
                              {" · "}
                              <a className="link" href={buildProxyUrl(photo.resultKey, { downloadName: downloadFileName(number, index, "wizualizacja", photo.resultKey) })}>
                                Pobierz
                              </a>
                            </>
                          )}
                        </span>
                        <ResultUpload photoId={photo.id} hasResult={Boolean(photo.resultKey)} disabled={order.status === "CANCELLED"} />
                      </figcaption>
                    </figure>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-ink">Akcje</h2>
            <OrderActions
              orderId={order.id}
              status={order.status}
              allResultsReady={allResultsReady}
              unpaid={order.paymentStatus === "UNPAID"}
            />
            <Link href={ROUTES.orderStatus(order.publicToken)} className="link mt-4 inline-block text-sm" target="_blank">
              Strona statusu klienta ↗
            </Link>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink">Klient</h2>
            <dl className="mt-2">
              <Row label="E-mail">
                <a className="link" href={`mailto:${order.email}`}>{order.email}</a>
              </Row>
              <Row label="Telefon">{order.phone ? <a className="link" href={`tel:${order.phone}`}>{order.phone}</a> : "—"}</Row>
              <Row label="Imię">{order.name ?? "—"}</Row>
              <Row label="Firma">{order.company ?? "—"}</Row>
              <Row label="NIP">{order.nip ?? "—"}</Row>
              <Row label="Kod polecenia">{order.referralCode ?? "—"}</Row>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink">Zamówienie</h2>
            <dl className="mt-2">
              <Row label="Styl">{getStyleName(order.style)}</Row>
              <Row label="Dodatki">{addons.length > 0 ? addons.map((a) => getAddon(a).name).join(", ") : "—"}</Row>
              <Row label="Ekspres">{order.express ? "Tak" : "Nie"}</Row>
              <Row label="Kwota">{formatPLN(order.totalAmount)}</Row>
              {breakdown && breakdown.creditsUsed > 0 && (
                <Row label="Kredyty">
                  {breakdown.creditsUsed} ({order.packageCode?.code ?? "kod usunięty"}){order.packageCreditsUsed === 0 && " – zwrócone"}
                </Row>
              )}
              <Row label="Płatność">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Row>
              <Row label="Opłacono">{order.paidAt ? formatDateTimePL(order.paidAt) : "—"}</Row>
              <Row label="Dostarczono">{order.deliveredAt ? formatDateTimePL(order.deliveredAt) : "—"}</Row>
              <Row label="Stripe sesja">
                <span className="font-mono text-xs">{order.stripeSessionId ?? "—"}</span>
              </Row>
              <Row label="Stripe PI">
                <span className="font-mono text-xs">{order.stripePaymentIntentId ?? "—"}</span>
              </Row>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink">Uwagi klienta</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{order.notes ?? "—"}</p>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink">Zgody</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {(Object.keys(consents) as ConsentKey[]).map((key) => (
                <li key={key} className={consents[key] ? "text-success" : "text-danger"}>
                  {consents[key] ? "✓" : "✗"} {CONSENT_LABELS[key]}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Zaakceptowane {formatDateTimePL(order.createdAt)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
