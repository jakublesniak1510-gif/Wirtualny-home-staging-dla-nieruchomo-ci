import type { Metadata } from "next";
import Link from "next/link";
import { ReferralRewardButton } from "@/components/admin/ReferralRewardButton";
import { requireAdmin } from "@/lib/admin-auth";
import { getReferralGroups } from "@/lib/admin-referrals";
import { formatDateTimePL, formatPLN } from "@/lib/format";
import { getOrderNumber } from "@/lib/orders";
import { REFERRAL_REWARD_PHOTOS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Polecenia" };

export default async function AdminReferralsPage() {
  await requireAdmin();
  const groups = await getReferralGroups();

  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-semibold text-ink">Polecenia</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Opłacone zamówienia z kodem polecenia (e-mail polecającego), pogrupowane po kodzie. „Wydaj nagrodę” tworzy kod pakietu na{" "}
        {REFERRAL_REWARD_PHOTOS} zdjęć, oznacza polecenia jako nagrodzone i wysyła e-mail do polecającego. Samopolecenia (ten sam e-mail) nie liczą się do nagrody.
      </p>
      <div className="mt-6 space-y-4">
        {groups.length === 0 && <p className="card p-6 text-center text-sm text-muted">Brak opłaconych zamówień z kodem polecenia.</p>}
        {groups.map((group) => (
          <section key={group.code} className="card p-5" data-testid="grupa-polecen">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="break-all text-base font-semibold text-ink">{group.code}</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Opłacone polecenia: <strong className="text-ink">{group.paidCount}</strong> · bez nagrody:{" "}
                  <strong className={group.pendingCount > 0 ? "text-brand" : "text-ink"}>{group.pendingCount}</strong>
                  {group.lastRewardAt && ` · ostatnia nagroda ${formatDateTimePL(group.lastRewardAt)}`}
                </p>
              </div>
              <ReferralRewardButton referralCode={group.code} photos={REFERRAL_REWARD_PHOTOS} disabled={group.pendingCount === 0} />
            </div>
            <ul className="mt-3 divide-y divide-line text-sm">
              {group.orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                  <Link href={`/admin/zamowienia/${order.id}`} className="link font-medium">
                    {getOrderNumber(order.id)}
                  </Link>
                  <span className="text-muted">{order.email}</span>
                  <span className="tabular-nums">{formatPLN(order.totalAmount)}</span>
                  <span className="text-muted">{order.paidAt ? `opłacono ${formatDateTimePL(order.paidAt)}` : ""}</span>
                  {order.selfReferral ? (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">samopolecenie</span>
                  ) : order.rewardIssuedAt ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">nagroda wydana</span>
                  ) : (
                    <span className="rounded-full bg-sand-light px-2 py-0.5 text-xs font-semibold text-sand-dark">czeka na nagrodę</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
