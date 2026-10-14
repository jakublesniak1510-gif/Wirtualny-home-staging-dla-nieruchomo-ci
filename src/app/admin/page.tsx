import type { OrderStatus, Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { STATS_DAYS, formatHoursMinutes, getDashboardStats } from "@/lib/admin-stats";
import { prisma } from "@/lib/db";
import { formatDateTimePL, formatPLN } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  getDeadline,
  getOrderNumber,
  isOverdue,
  parseOrderNumber,
} from "@/lib/orders";
import { getStyleName } from "@/lib/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Zamówienia" };

function Tile({ label, value, hint, tone = "default", href }: { label: string; value: string; hint?: string; tone?: "default" | "danger" | "brand"; href?: string }) {
  const toneClass = tone === "danger" ? "border-danger/30 bg-danger/5" : tone === "brand" ? "border-brand/20 bg-brand-light" : "";
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "danger" ? "text-danger" : "text-ink"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={`card block p-4 transition-shadow hover:shadow-lift ${toneClass}`}>
      {body}
    </Link>
  ) : (
    <div className={`card p-4 ${toneClass}`}>{body}</div>
  );
}

const STATUS_FILTERS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "aktywne", label: "Do realizacji (opłacone, w realizacji)" },
  { value: "", label: "Wszystkie" },
  ...(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

const STATUS_TONES: Record<OrderStatus, string> = {
  NEW: "bg-line text-ink",
  PAID: "bg-sand-light text-sand-dark",
  IN_PROGRESS: "bg-brand-light text-brand",
  READY: "bg-brand text-white",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/10 text-danger",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const params = await searchParams;
  const statusParam = first(params.status) || (params.status === undefined ? "aktywne" : "");
  const q = first(params.q).trim();

  const where: Prisma.OrderWhereInput = {};
  if (statusParam === "aktywne") where.status = { in: ["PAID", "IN_PROGRESS"] };
  else if (statusParam in ORDER_STATUS_LABELS) where.status = statusParam as OrderStatus;
  if (q) {
    const idSuffix = parseOrderNumber(q);
    where.OR = [
      { email: { contains: q.toLowerCase() } },
      ...(idSuffix ? [{ id: { endsWith: idSuffix } }] : []),
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      _count: { select: { photos: true, revisions: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } } } },
      photos: { select: { resultKey: true, _count: { select: { aiVariants: true } } } },
    },
  });
  const now = new Date();
  const stats = await getDashboardStats(now);

  return (
    <div className="container-x py-8">
      <section aria-label="Podsumowanie" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="kafelki">
        <Tile label="Do zrobienia" value={String(stats.toDo)} hint="opłacone + w realizacji" tone={stats.toDo > 0 ? "brand" : "default"} href="/admin?status=aktywne" />
        <Tile label="Po terminie" value={String(stats.overdue)} hint="opłacone, niedostarczone" tone={stats.overdue > 0 ? "danger" : "default"} />
        <Tile label="Otwarte poprawki" value={String(stats.openRevisions)} hint="nowe + w realizacji" tone={stats.openRevisions > 0 ? "danger" : "default"} href="/admin/poprawki" />
        <Tile label={`Przychód ${STATS_DAYS} dni`} value={formatPLN(stats.revenue30d)} hint={`${stats.paidOrders30d} opłaconych zamówień`} />
        <Tile
          label="Średni czas realizacji"
          value={stats.avgTurnaroundMs === null ? "—" : formatHoursMinutes(stats.avgTurnaroundMs)}
          hint={`opłacenie → dostarczenie, ${stats.delivered30d} zam. / ${STATS_DAYS} dni`}
        />
        <Tile label={`Koszt AI ${STATS_DAYS} dni`} value={formatPLN(stats.aiCost30d)} hint={`${stats.aiVariants30d} wariantów (szacunek)`} />
      </section>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Zamówienia</h1>
          <p className="mt-1 text-sm text-muted">
            {orders.length === 200 ? "Pokazano 200 najnowszych" : `Znaleziono: ${orders.length}`}
          </p>
        </div>
        <form className="flex flex-wrap items-end gap-2" role="search">
          <label className="text-sm">
            <span className="block text-xs font-medium text-muted">Status</span>
            <select name="status" defaultValue={statusParam} className="mt-1 rounded-control border border-line bg-surface px-3 py-2 text-sm">
              {STATUS_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs font-medium text-muted">E-mail lub numer</span>
            <input name="q" defaultValue={q} placeholder="WS-… lub e-mail" className="mt-1 w-56 rounded-control border border-line bg-surface px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="btn-primary min-h-10 py-2">
            Filtruj
          </button>
        </form>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[68rem] text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Numer</th>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Klient</th>
              <th scope="col" className="px-4 py-3">Zdjęcia</th>
              <th scope="col" className="px-4 py-3">Styl</th>
              <th scope="col" className="px-4 py-3 text-right">Kwota</th>
              <th scope="col" className="px-4 py-3">Płatność</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Termin</th>
              <th scope="col" className="px-4 py-3">Poprawki</th>
              <th scope="col" className="px-4 py-3">AI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-muted">
                  Brak zamówień dla wybranych filtrów.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const overdue = isOverdue(order, now);
              const results = order.photos.filter((p) => p.resultKey).length;
              const aiCount = order.photos.reduce((sum, p) => sum + p._count.aiVariants, 0);
              return (
                <tr key={order.id} className={overdue ? "bg-danger/5" : "hover:bg-paper"}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    <Link href={`/admin/zamowienia/${order.id}`} className="link">
                      {getOrderNumber(order.id)}
                    </Link>
                    {order.isSample && <span className="ml-2 rounded-full bg-sand-light px-2 py-0.5 text-[11px] text-sand-dark">próbka</span>}
                    {order.express && <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">ekspres</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTimePL(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="block max-w-[14rem] truncate">{order.email}</span>
                    {(order.name || order.company) && (
                      <span className="block max-w-[14rem] truncate text-xs text-muted">
                        {[order.name, order.company].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {results}/{order._count.photos}
                  </td>
                  <td className="px-4 py-3">{getStyleName(order.style)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatPLN(order.totalAmount)}</td>
                  <td className="px-4 py-3">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 ${overdue ? "font-semibold text-danger" : "text-muted"}`}>
                    {order.paymentStatus === "UNPAID" ? "—" : formatDateTimePL(getDeadline(order))}
                    {overdue && <span className="block text-xs">po terminie</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {order._count.revisions > 0 ? (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">{order._count.revisions} otwarte</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">{aiCount > 0 ? `${aiCount} war.` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
