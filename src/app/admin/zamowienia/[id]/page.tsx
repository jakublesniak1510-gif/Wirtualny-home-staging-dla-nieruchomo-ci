import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BulkResultUpload } from "@/components/admin/BulkResultUpload";
import { DeadlineCountdown } from "@/components/admin/DeadlineCountdown";
import { InternalNotes } from "@/components/admin/InternalNotes";
import { OrderActions } from "@/components/admin/OrderActions";
import { PhotoWorkbench } from "@/components/admin/PhotoWorkbench";
import { RevisionList } from "@/components/admin/RevisionList";
import { requireAdmin } from "@/lib/admin-auth";
import { getVariantsPerPhoto } from "@/lib/ai/config";
import { defaultPromptForOrder, recoverStaleVariants } from "@/lib/ai/generate";
import { getDefaultProvider, getProviderSummaries } from "@/lib/ai/index";
import { toPhotoResultView, toVariantView } from "@/lib/ai/view";
import { CONSENT_LABELS } from "@/lib/consents";
import type { ConsentKey } from "@/lib/consents";
import { prisma } from "@/lib/db";
import { formatFileSize } from "@/lib/file-size";
import { formatDateTimePL, formatPLN } from "@/lib/format";
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

export const metadata: Metadata = { title: "Stanowisko pracy – zamówienie" };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-ink">{children}</dd>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
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
  await recoverStaleVariants().catch(() => 0);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
        include: {
          results: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          aiVariants: { orderBy: { createdAt: "desc" }, take: 30 },
        },
      },
      revisions: { orderBy: { createdAt: "desc" }, include: { photo: { select: { sortOrder: true } } } },
      packageCode: true,
    },
  });
  if (!order) notFound();

  const now = new Date();
  const number = getOrderNumber(order.id);
  const addons = parseAddons(order.addons);
  const breakdown = parseBreakdown(order.priceBreakdown);
  const results = order.photos.filter((p) => p.resultKey).length;
  const allResultsReady = order.photos.length > 0 && results === order.photos.length;
  const overdue = isOverdue(order, now);
  const deadline = getDeadline(order);
  const active = order.status === "PAID" || order.status === "IN_PROGRESS";
  const filesAvailable = !order.filesDeletedAt;
  const cancelled = order.status === "CANCELLED";
  const providers = getProviderSummaries();
  const defaultProvider = getDefaultProvider();
  const defaultPrompt = defaultPromptForOrder(order);
  const defaultCount = getVariantsPerPhoto();
  const openRevisions = order.revisions.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS").length;
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

      <section className="card mt-3 p-5" aria-labelledby="naglowek-zamowienia">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="naglowek-zamowienia" className="text-2xl font-semibold text-ink">
            Zamówienie {number}
          </h1>
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand" data-testid="status-zamowienia">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          {order.isSample && <span className="rounded-full bg-sand-light px-3 py-1 text-xs font-semibold text-sand-dark">Darmowa próbka</span>}
          {order.express && <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">EKSPRES</span>}
          {openRevisions > 0 && (
            <a href="#poprawki" className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
              Otwarte poprawki: {openRevisions}
            </a>
          )}
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Fact label="Klient">
              <span className="block">{[order.name, order.company].filter(Boolean).join(", ") || "—"}</span>
              <a className="link text-xs" href={`mailto:${order.email}`}>
                {order.email}
              </a>
            </Fact>
            <Fact label="Styl">{getStyleName(order.style)}</Fact>
            <Fact label="Dodatki">{addons.length > 0 ? addons.map((a) => getAddon(a).name).join(", ") : "—"}</Fact>
            <Fact label="Realizacja">{order.express ? "Ekspres" : order.isSample ? "Próbka (48 h)" : "Standard"}</Fact>
            <Fact label="Termin">
              <span className={`block ${overdue ? "font-semibold text-danger" : ""}`}>{formatDateTimePL(deadline)}</span>
              <span className="text-xs">
                <DeadlineCountdown deadline={deadline.toISOString()} active={active} now={now.toISOString()} />
              </span>
            </Fact>
            <Fact label="Zdjęcia">
              wyniki {results}/{order.photos.length}
            </Fact>
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Uwagi klienta</dt>
              <dd className="mt-0.5 whitespace-pre-line rounded-control bg-cream px-3 py-2 text-sm text-ink" data-testid="uwagi-klienta">
                {order.notes ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="space-y-3">
            <OrderActions orderId={order.id} status={order.status} allResultsReady={allResultsReady} unpaid={order.paymentStatus === "UNPAID"} />
            <div className="flex flex-wrap gap-2">
              {filesAvailable && (
                <a href={`/api/admin/orders/${order.id}/download`} className="btn-secondary min-h-9 py-1.5 text-sm" download>
                  Pobierz oryginały (ZIP)
                </a>
              )}
              <Link href={ROUTES.orderStatus(order.publicToken)} className="btn-secondary min-h-9 py-1.5 text-sm" target="_blank">
                Strona klienta ↗
              </Link>
            </div>
          </div>

          <InternalNotes orderId={order.id} initial={order.internalNotes ?? ""} />
        </div>
      </section>

      {!filesAvailable && (
        <p className="mt-6 rounded-control bg-cream p-4 text-sm text-muted">
          Pliki usunięte {order.filesDeletedAt ? formatDateTimePL(order.filesDeletedAt) : ""} (sprzątanie po 30 dniach).
        </p>
      )}

      {filesAvailable && (
        <>
          <section className="card mt-6 p-5" aria-labelledby="upload-zbiorczy">
            <h2 id="upload-zbiorczy" className="text-lg font-semibold text-ink">
              Upload zbiorczy wyników
            </h2>
            <p className="mb-3 mt-1 text-sm text-muted">Wgraj gotowe pliki dla wszystkich zdjęć naraz – znak wodny „wizualizacja” dodamy automatycznie.</p>
            <BulkResultUpload
              disabled={cancelled}
              photos={order.photos.map((photo, index) => ({ id: photo.id, index, name: photo.originalName, hasResult: Boolean(photo.resultKey) }))}
            />
          </section>

          <section className="mt-6" aria-labelledby="zdjecia-admin">
            <h2 id="zdjecia-admin" className="text-lg font-semibold text-ink">
              Zdjęcia – wyniki {results}/{order.photos.length}
            </h2>
            <ul className="mt-3 space-y-4">
              {order.photos.map((photo, index) => (
                <PhotoWorkbench
                  key={photo.id}
                  photo={{
                    id: photo.id,
                    index,
                    name: photo.originalName,
                    meta: `${photo.width ?? "?"}×${photo.height ?? "?"} · ${formatFileSize(photo.size)}`,
                    originalUrl: buildProxyUrl(photo.originalKey, { width: 1600 }),
                    originalThumbUrl: buildProxyUrl(photo.originalKey, { width: 800 }),
                    originalDownloadUrl: buildProxyUrl(photo.originalKey, {
                      downloadName: downloadFileName(number, index, "oryginal", photo.originalKey),
                    }),
                    resultUrl: photo.resultKey ? buildProxyUrl(photo.resultKey) : null,
                    resultThumbUrl: photo.resultKey ? buildProxyUrl(photo.resultKey, { width: 800 }) : null,
                    resultDownloadUrl: photo.resultKey
                      ? buildProxyUrl(photo.resultKey, { downloadName: downloadFileName(number, index, "wizualizacja", photo.resultKey) })
                      : null,
                    resultInfo: photo.resultUploadedAt ? `wgrano ${formatDateTimePL(photo.resultUploadedAt)}` : "znak wodny dodamy automatycznie",
                  }}
                  results={photo.results.map(toPhotoResultView)}
                  initialVariants={photo.aiVariants.map(toVariantView)}
                  defaultPrompt={defaultPrompt}
                  providers={providers}
                  defaultProviderId={defaultProvider?.id ?? null}
                  defaultCount={defaultCount}
                  disabled={cancelled}
                />
              ))}
            </ul>
          </section>
        </>
      )}

      <section id="poprawki" className="card mt-6 p-5" aria-labelledby="poprawki-naglowek">
        <h2 id="poprawki-naglowek" className="text-lg font-semibold text-ink">
          Poprawki ({order.revisions.length})
        </h2>
        <p className="mt-1 text-sm text-muted">Poprawiony plik wgraj przy zdjęciu (wynik główny lub wariant), potem oznacz zgłoszenie jako „Zrobione”.</p>
        <div className="mt-2">
          <RevisionList
            revisions={order.revisions.map((revision) => ({
              id: revision.id,
              photoLabel: revision.photo ? `Zdjęcie ${revision.photo.sortOrder + 1}` : "Całe zamówienie",
              message: revision.message,
              status: revision.status,
              reply: revision.reply,
              createdAt: formatDateTimePL(revision.createdAt),
              resolvedAt: revision.resolvedAt ? formatDateTimePL(revision.resolvedAt) : null,
            }))}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink">Klient</h2>
          <dl className="mt-2">
            <Row label="E-mail">
              <a className="link" href={`mailto:${order.email}`}>
                {order.email}
              </a>
            </Row>
            <Row label="Telefon">{order.phone ? <a className="link" href={`tel:${order.phone}`}>{order.phone}</a> : "—"}</Row>
            <Row label="Imię">{order.name ?? "—"}</Row>
            <Row label="Firma">{order.company ?? "—"}</Row>
            <Row label="NIP">{order.nip ?? "—"}</Row>
            <Row label="Kod polecenia">{order.referralCode ?? "—"}</Row>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink">Płatność</h2>
          <dl className="mt-2">
            <Row label="Kwota">{formatPLN(order.totalAmount)}</Row>
            {breakdown && breakdown.creditsUsed > 0 && (
              <Row label="Kredyty">
                {breakdown.creditsUsed} ({order.packageCode?.code ?? "kod usunięty"}){order.packageCreditsUsed === 0 && " – zwrócone"}
              </Row>
            )}
            <Row label="Płatność">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Row>
            <Row label="Złożono">{formatDateTimePL(order.createdAt)}</Row>
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
      </div>
    </div>
  );
}
