import type { OrderStatus, Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
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
    include: { _count: { select: { photos: true } }, photos: { select: { resultKey: true } } },
  });
  const now = new Date();

  return (
    <div className="container-x py-8">
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
        <table className="w-full min-w-[60rem] text-left text-sm">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted">
                  Brak zamówień dla wybranych filtrów.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const overdue = isOverdue(order, now);
              const results = order.photos.filter((p) => p.resultKey).length;
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
