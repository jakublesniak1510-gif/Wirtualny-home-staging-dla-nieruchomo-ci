import { prisma } from "@/lib/db";
import { isOverdue } from "@/lib/orders";

/** Kafelki dashboardu panelu (ostatnie 30 dni). */

export const STATS_DAYS = 30;

export interface DashboardStats {
  toDo: number;
  overdue: number;
  openRevisions: number;
  revenue30d: number;
  paidOrders30d: number;
  /** Średni czas opłacenie → dostarczenie w ms (null, gdy brak danych). */
  avgTurnaroundMs: number | null;
  delivered30d: number;
  aiCost30d: number;
  aiVariants30d: number;
}

export async function getDashboardStats(now: Date = new Date()): Promise<DashboardStats> {
  const since = new Date(now.getTime() - STATS_DAYS * 24 * 3_600_000);
  const [active, openRevisions, revenue, delivered, ai] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "IN_PROGRESS"] } },
      select: { status: true, createdAt: true, paidAt: true, express: true, isSample: true },
    }),
    prisma.revisionRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", paidAt: { gte: since } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { deliveredAt: { gte: since }, paidAt: { not: null } },
      select: { paidAt: true, deliveredAt: true },
    }),
    prisma.aiVariant.aggregate({ where: { createdAt: { gte: since } }, _sum: { costCents: true }, _count: true }),
  ]);

  const durations = delivered
    .filter((order) => order.paidAt && order.deliveredAt && order.deliveredAt >= order.paidAt)
    .map((order) => (order.deliveredAt as Date).getTime() - (order.paidAt as Date).getTime());

  return {
    toDo: active.length,
    overdue: active.filter((order) => isOverdue(order, now)).length,
    openRevisions,
    revenue30d: revenue._sum.totalAmount ?? 0,
    paidOrders30d: revenue._count,
    avgTurnaroundMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    delivered30d: durations.length,
    aiCost30d: ai._sum.costCents ?? 0,
    aiVariants30d: ai._count,
  };
}

/** „5 h 20 min”, „1 d 3 h”. */
export function formatHoursMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${mins} min`;
  return `${mins} min`;
}
