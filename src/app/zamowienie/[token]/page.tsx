import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { CopyButton } from "@/components/order/CopyButton";
import { DeadlineCountdown } from "@/components/order/DeadlineCountdown";
import { OrderGallery } from "@/components/order/OrderGallery";
import type { GalleryPhoto } from "@/components/order/gallery-types";
import { PaymentStatusPoller } from "@/components/order/PaymentStatusPoller";
import { RetryPaymentButton } from "@/components/order/RetryPaymentButton";
import { RevisionForm } from "@/components/order/RevisionForm";
import { StatusTimeline } from "@/components/order/StatusTimeline";
import { prisma } from "@/lib/db";
import { orderFileUrl } from "@/lib/file-access";
import { formatDateTimePL, formatPLN, formatPhotoCount } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  getDeadline,
  getOrderNumber,
  listPhotoVariants,
  parseAddons,
  referralPath,
  variantFileName,
} from "@/lib/orders";
import { INCLUDED_REVISIONS, REFERRAL_REWARD_PHOTOS, REVISION_WINDOW_DAYS, getAddon } from "@/lib/pricing";
import {
  REVISION_MESSAGE_MAX,
  REVISION_MESSAGE_MIN,
  countRounds,
  getRevisionEligibility,
  getRevisionStatusLabel,
  groupRevisionRounds,
} from "@/lib/revisions";
import { ROUTES, SITE, absoluteUrl } from "@/lib/site";
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

function mailto(subject: string, body: string): string {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const ROUND_TONE: Record<string, "brand" | "sand" | "neutral" | "solid"> = {
  OPEN: "sand",
  IN_PROGRESS: "brand",
  DONE: "solid",
  REJECTED: "neutral",
};

/** Status rundy: w toku, jeśli którekolwiek zdjęcie w toku; inaczej wykonane, jeśli coś wykonano. */
function roundStatus(statuses: readonly string[]): string {
  if (statuses.includes("OPEN")) return "OPEN";
  if (statuses.includes("IN_PROGRESS")) return "IN_PROGRESS";
  if (statuses.includes("DONE")) return "DONE";
  return "REJECTED";
}

export default async function OrderStatusPage({ params, searchParams }: PageProps<"/zamowienie/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) notFound();

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      photos: { orderBy: { sortOrder: "asc" }, include: { results: true } },
      revisions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const now = new Date();
  const number = getOrderNumber(order.id);
  const addons = parseAddons(order.addons);
  const deadline = getDeadline(order);
  const paymentReturn = query.platnosc === "ok";
  const unpaid = order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";
  const filesAvailable = !order.filesDeletedAt;
  const finished = order.status === "READY" || order.status === "DELIVERED";
  const inProgress = !unpaid && (order.status === "PAID" || order.status === "IN_PROGRESS");
  const storage = getStorage();

  const gallery: GalleryPhoto[] = [];
  for (const [index, photo] of order.photos.entries()) {
    const variants = await Promise.all(
      listPhotoVariants(photo).map(async (variant) => {
        const fileName = variantFileName(number, index, variant.letter, variant.key);
        return {
          id: variant.id,
          letter: variant.letter,
          label: variant.label,
          src: orderFileUrl(variant.key, token, { width: 1600 }),
          thumb: orderFileUrl(variant.key, token, { width: 200 }),
          downloadUrl: filesAvailable
            ? await storage.getSignedOrProxyUrl(variant.key, { token, downloadName: fileName })
            : "",
          fileName,
        };
      }),
    );
    gallery.push({
      id: photo.id,
      number: index + 1,
      name: photo.originalName,
      width: photo.width ?? 4,
      height: photo.height ?? 3,
      beforeSrc: orderFileUrl(photo.originalKey, token, { width: 1600 }),
      beforeThumb: orderFileUrl(photo.originalKey, token, { width: 400 }),
      variants,
    });
  }
  const variantsCount = gallery.reduce((sum, photo) => sum + photo.variants.length, 0);
  const zipUrl = variantsCount > 0 && filesAvailable ? `/api/orders/${token}/download` : null;

  const photoNumber = new Map(order.photos.map((photo, index) => [photo.id, index + 1]));
  const rounds = groupRevisionRounds(order.revisions);
  const eligibility = getRevisionEligibility({
    status: order.status,
    deliveredAt: order.deliveredAt,
    roundsUsed: countRounds(order.revisions),
    now,
  });
  const latestRound = rounds[0] ?? [];
  const roundPending = latestRound.some((r) => r.status === "OPEN" || r.status === "IN_PROGRESS");
  const paidRevisionMailto = mailto(
    `Płatna poprawka – zamówienie ${number}`,
    `Dzień dobry,\n\nproszę o wycenę poprawki w zamówieniu ${number}.\n\nNumer zdjęcia: \nCo zmienić: \n\nPozdrawiam`,
  );
  const reviewMailto = mailto(
    `Opinia o zamówieniu ${number}`,
    `Dzień dobry,\n\nmoja opinia o współpracy (zamówienie ${number}):\n\n\nMożecie ją opublikować na stronie: TAK / NIE\n\nPozdrawiam`,
  );
  const referralUrl = absoluteUrl(referralPath(order.email));

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
          <p className="mt-2 text-sm text-muted">
            Złożone {formatDateTimePL(order.createdAt)} · {formatPhotoCount(order.photoCount)} · styl{" "}
            {getStyleName(order.style).toLowerCase()}
          </p>
        </div>
        {zipUrl && (
          <a href={zipUrl} className="btn-primary" download data-testid="download-zip">
            Pobierz wszystkie (ZIP{variantsCount > order.photos.length ? `, ${variantsCount} plików` : ""})
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
            <p className="text-sm text-ink">Czekamy na płatność. Realizację zaczniemy zaraz po jej zaksięgowaniu.</p>
            {isStripeConfigured() && <RetryPaymentButton token={token} />}
          </div>
        )}
        {inProgress && (
          <div className="mt-6 rounded-control bg-cream p-4">
            <DeadlineCountdown deadline={deadline.toISOString()} serverNow={now.getTime()} />
            <p className="mt-1 text-xs text-muted">Gdy wizualizacje będą gotowe, wyślemy e-mail na {order.email}.</p>
          </div>
        )}
        {finished && (
          <p className="mt-6 text-sm text-ink">
            {order.deliveredAt ? (
              <>
                Dostarczono <strong>{formatDateTimePL(order.deliveredAt)}</strong>.{" "}
              </>
            ) : (
              "Wizualizacje są gotowe. "
            )}
            Porównaj je suwakiem, pobierz i – jeśli trzeba – zgłoś poprawkę poniżej.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="zdjecia-title">
            <h2 id="zdjecia-title" className="text-xl font-semibold text-ink">
              Zdjęcia ({order.photos.length})
            </h2>
            {filesAvailable ? (
              <OrderGallery
                photos={gallery}
                zipUrl={zipUrl}
                pendingText={order.status === "CANCELLED" ? "Zamówienie anulowane" : "Wizualizacja w przygotowaniu"}
              />
            ) : (
              <p className="mt-3 rounded-control bg-cream p-4 text-sm text-muted">
                Pliki tego zamówienia zostały usunięte po 30 dniach od realizacji, zgodnie z polityką prywatności.
              </p>
            )}
          </section>

          {(finished || rounds.length > 0) && (
            <section aria-labelledby="poprawki-title" id="poprawki">
              <h2 id="poprawki-title" className="text-xl font-semibold text-ink">
                Poprawki
              </h2>
              <p className="mt-2 text-sm text-muted">
                W cenie masz {INCLUDED_REVISIONS} bezpłatną rundę poprawek (może dotyczyć kilku zdjęć naraz) – do{" "}
                {REVISION_WINDOW_DAYS} dni od dostarczenia
                {eligibility.windowEndsAt ? (
                  <>
                    , czyli do <strong className="text-ink">{formatDateTimePL(eligibility.windowEndsAt)}</strong>
                  </>
                ) : null}
                .
              </p>

              {rounds.length > 0 && (
                <ul className="mt-4 space-y-3" data-testid="revision-list">
                  {rounds.map((round) => {
                    const first = round[0];
                    if (!first) return null;
                    const status = roundStatus(round.map((r) => r.status));
                    const targets = round.map((r) =>
                      r.photoId && photoNumber.has(r.photoId) ? `zdjęcie ${photoNumber.get(r.photoId)}` : "całe zamówienie",
                    );
                    const replies = [...new Set(round.map((r) => r.reply?.trim()).filter((r): r is string => Boolean(r)))];
                    return (
                      <li key={first.id} className="card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-muted">
                            {formatDateTimePL(first.createdAt)} · {targets.join(", ")}
                          </p>
                          <Badge tone={ROUND_TONE[status] ?? "neutral"}>{getRevisionStatusLabel(status)}</Badge>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm text-ink">{first.message}</p>
                        {round.length > 1 && round.some((r) => r.status !== status) && (
                          <ul className="mt-2 text-xs text-muted">
                            {round.map((r, i) => (
                              <li key={r.id}>
                                {targets[i]}: {getRevisionStatusLabel(r.status)}
                              </li>
                            ))}
                          </ul>
                        )}
                        {replies.map((reply) => (
                          <div key={reply} className="mt-3 rounded-control bg-brand-light p-3 text-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Odpowiedź {SITE.name}</p>
                            <p className="mt-1 whitespace-pre-line text-ink">{reply}</p>
                          </div>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="card mt-4 p-5">
                {eligibility.allowed ? (
                  <>
                    <h3 className="mb-4 text-base font-semibold text-ink">Zgłoś bezpłatną poprawkę</h3>
                    <RevisionForm
                      token={token}
                      photos={gallery.map((photo) => ({
                        id: photo.id,
                        number: photo.number,
                        name: photo.name,
                        thumb: photo.variants[0]?.thumb ?? photo.beforeThumb,
                      }))}
                      minLength={REVISION_MESSAGE_MIN}
                      maxLength={REVISION_MESSAGE_MAX}
                    />
                  </>
                ) : (
                  <div data-testid="revision-closed">
                    <p className="text-sm text-ink">
                      {eligibility.reason === "limit" && roundPending
                        ? "Dziękujemy – Twoje zgłoszenie poprawki jest u nas. Zwykle odpowiadamy w ciągu 24 h (w dni robocze), a gdy poprawione wizualizacje będą gotowe, wyślemy e-mail."
                        : eligibility.reason === "limit"
                        ? "Bezpłatna runda poprawek została już wykorzystana."
                        : eligibility.reason === "window"
                          ? `Minęło ${REVISION_WINDOW_DAYS} dni od dostarczenia – okres bezpłatnych poprawek się zakończył.`
                          : "Poprawki zgłosisz, gdy wizualizacje będą gotowe."}
                    </p>
                    {eligibility.reason !== "status" && (
                      <>
                        <p className="mt-1 text-sm text-muted">
                          Potrzebujesz kolejnej zmiany? Wykonamy ją jako płatną poprawkę – napisz, przygotujemy wycenę.
                        </p>
                        <a href={paidRevisionMailto} className="btn-secondary mt-4">
                          Zamów płatną poprawkę
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {finished && (
            <section aria-labelledby="co-dalej-title" className="rounded-card bg-cream p-5 sm:p-7" data-testid="next-steps">
              <h2 id="co-dalej-title" className="text-xl font-semibold text-ink">
                Co dalej?
              </h2>
              <ol className="mt-5 grid gap-5 sm:grid-cols-2">
                <li>
                  <h3 className="font-semibold text-ink">1. Opublikuj uczciwie</h3>
                  <p className="mt-1 text-sm text-ink/80">
                    W ogłoszeniu wstaw zdjęcie oryginalne, a obok wizualizację z opisem „wirtualna aranżacja”. Nie usuwaj
                    znaku „wizualizacja” – kupujący docenią przejrzystość, a Ty unikniesz zarzutu wprowadzania w błąd.
                  </p>
                </li>
                <li>
                  <h3 className="font-semibold text-ink">2. Pobierz komplet</h3>
                  <p className="mt-1 text-sm text-ink/80">
                    ZIP zawiera wszystkie warianty i plik CZYTAJ.txt z zasadami publikacji. Pliki przechowujemy 30 dni –
                    zapisz je u siebie. Szczegóły w{" "}
                    <Link href={ROUTES.terms} className="link">
                      regulaminie
                    </Link>
                    .
                  </p>
                </li>
                <li>
                  <h3 className="font-semibold text-ink">3. Daj znać, jak poszło</h3>
                  <p className="mt-1 text-sm text-ink/80">
                    Twoja opinia pomaga nam się rozwijać, a innym agentom – wybrać. To zajmie minutę.
                  </p>
                  <a href={reviewMailto} className="link mt-2 inline-block text-sm">
                    Napisz opinię
                  </a>
                </li>
                <li>
                  <h3 className="font-semibold text-ink">4. Poleć nas – {REFERRAL_REWARD_PHOTOS} zdjęć gratis</h3>
                  <p className="mt-1 text-sm text-ink/80">
                    Twój kod polecenia to Twój e-mail (<strong>{order.email}</strong>). Polecony wpisuje go w kreatorze
                    zamówienia; po jego pierwszym opłaconym zamówieniu dostaniesz kod na {REFERRAL_REWARD_PHOTOS} zdjęć.
                  </p>
                </li>
              </ol>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="link-polecajacy" className="sr-only">
                  Twój link polecający
                </label>
                <input
                  id="link-polecajacy"
                  readOnly
                  value={referralUrl}
                  className="min-w-0 flex-1 rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                />
                <CopyButton text={referralUrl} label="Kopiuj link polecający" />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-ink">Szczegóły</h2>
            <dl className="mt-2 divide-y divide-line/70">
              <Detail label="Liczba zdjęć">{formatPhotoCount(order.photoCount)}</Detail>
              <Detail label="Styl">{getStyleName(order.style)}</Detail>
              <Detail label="Dodatki">{addons.length > 0 ? addons.map((a) => getAddon(a).name).join(", ") : "—"}</Detail>
              <Detail label="Realizacja">
                {order.isSample ? "24–48 h" : order.express ? `Ekspres (${SITE.expressHours} h)` : `${SITE.turnaroundHours} h`}
              </Detail>
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

          {finished && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-ink">Poprawki</h2>
              <p className="mt-2 text-sm text-muted">
                {eligibility.allowed
                  ? `Masz ${eligibility.roundsLeft} bezpłatną rundę poprawek${eligibility.windowEndsAt ? ` do ${formatDateTimePL(eligibility.windowEndsAt)}` : ""}.`
                  : roundPending
                    ? "Twoje zgłoszenie poprawki jest w realizacji – damy znać e-mailem."
                    : "Bezpłatna poprawka nie jest już dostępna – kolejne zmiany wycenimy indywidualnie."}
              </p>
              <a href="#poprawki" className={`mt-4 w-full ${eligibility.allowed ? "btn-primary" : "btn-secondary"}`}>
                {eligibility.allowed ? "Zgłoś poprawkę" : "Zobacz zgłoszenia"}
              </a>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-ink">Wszystkie zamówienia</h2>
            <p className="mt-2 text-sm text-muted">
              Zamówienia i kody pakietów z adresu {order.email} zobaczysz w jednym miejscu – bez zakładania konta.
            </p>
            <Link href={ROUTES.myOrders} className="link mt-3 inline-block text-sm">
              Moje zamówienia
            </Link>
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
