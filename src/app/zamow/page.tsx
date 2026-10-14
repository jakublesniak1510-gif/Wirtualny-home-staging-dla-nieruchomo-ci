import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { OrderWizard } from "@/components/order/OrderWizard";
import { RetryPaymentButton } from "@/components/order/RetryPaymentButton";
import { prisma } from "@/lib/db";
import { MIN_SHORT_SIDE, getMaxUploadMb } from "@/lib/images";
import { getOrderNumber } from "@/lib/orders";
import { MAX_PHOTOS, isAddonSlug } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";
import { isStripeConfigured } from "@/lib/stripe";
import { DEFAULT_STYLE, isStyleSlug } from "@/lib/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zamów wizualizacje",
  description: `Wgraj zdjęcia pustego mieszkania, wybierz styl i zapłać BLIK-iem. Gotowe wizualizacje w ${SITE.turnaroundHours} h.`,
  alternates: { canonical: ROUTES.order },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function CancelledBanner({ token }: { token?: string }) {
  const order = token
    ? await prisma.order.findUnique({
        where: { publicToken: token },
        select: { id: true, publicToken: true, paymentStatus: true, status: true },
      })
    : null;
  const canRetry = order && order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";
  return (
    <div className="mt-6 rounded-card border border-sand bg-sand-light p-5" role="status">
      <p className="font-semibold text-ink">Płatność została przerwana.</p>
      {canRetry ? (
        <>
          <p className="mt-1 text-sm text-ink/80">
            Zamówienie {getOrderNumber(order.id)} jest zapisane i czeka na płatność. Możesz do niej wrócić albo złożyć
            nowe zamówienie poniżej.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <RetryPaymentButton token={order.publicToken} />
            <Link href={ROUTES.orderStatus(order.publicToken)} className="btn-secondary">
              Status zamówienia
            </Link>
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-ink/80">Nic nie zostało pobrane. Możesz złożyć zamówienie ponownie.</p>
      )}
    </div>
  );
}

export default async function OrderPage({ searchParams }: PageProps<"/zamow">) {
  const params = await searchParams;
  const requested = first(params.styl);
  const initialStyle = requested && isStyleSlug(requested) ? requested : DEFAULT_STYLE;
  const cancelled = first(params.anulowano) === "1";
  const initialAddons = (first(params.dodatki) ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug): slug is AddonSlug => isAddonSlug(slug));
  const initialExpress = first(params.ekspres) === "1";
  const initialReferralCode = (first(params.polecenie) ?? "").trim().slice(0, 254);
  const initialPackageCode = (first(params.kod) ?? "").trim().toUpperCase().slice(0, 40);
  const plannedRaw = Number.parseInt(first(params.zdjecia) ?? "", 10);
  const plannedPhotoCount =
    Number.isInteger(plannedRaw) && plannedRaw >= 1 && plannedRaw <= MAX_PHOTOS ? plannedRaw : undefined;

  return (
    <div className="container-x pb-28 pt-10 sm:pt-14 lg:pb-20">
      <Badge tone="sand">Zamówienie</Badge>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Zamów wizualizacje</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Trzy proste kroki: zdjęcia, styl, dane. Cenę widzisz od razu, a gotowe wizualizacje z oznaczeniem
        „wizualizacja” odbierzesz w {SITE.turnaroundHours} h. Chcesz najpierw sprawdzić jakość?{" "}
        <Link href={ROUTES.freeSample} className="link">
          Zamów darmową próbkę
        </Link>
        .
      </p>
      {cancelled && <CancelledBanner token={first(params.zamowienie)} />}
      <OrderWizard
        initialStyle={initialStyle}
        initialAddons={initialAddons}
        initialExpress={initialExpress}
        initialReferralCode={initialReferralCode}
        initialPackageCode={initialPackageCode}
        plannedPhotoCount={plannedPhotoCount}
        maxMb={getMaxUploadMb()}
        minShortSide={MIN_SHORT_SIDE}
        paymentsEnabled={isStripeConfigured()}
      />
    </div>
  );
}
