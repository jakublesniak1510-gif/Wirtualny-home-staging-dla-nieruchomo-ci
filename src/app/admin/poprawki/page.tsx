import type { Metadata } from "next";
import Link from "next/link";
import { REVISION_STATUS_LABELS, REVISION_STATUS_TONES } from "@/components/admin/revision-labels";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTimePL } from "@/lib/format";
import { getOrderNumber } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Poprawki" };

export default async function AdminRevisionsPage({ searchParams }: PageProps<"/admin/poprawki">) {
  await requireAdmin();
  const params = await searchParams;
  const showAll = params.wszystkie === "1";
  const revisions = await prisma.revisionRequest.findMany({
    where: showAll ? {} : { status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: { createdAt: showAll ? "desc" : "asc" },
    take: 300,
    include: {
      order: { select: { id: true, email: true, name: true, express: true } },
      photo: { select: { sortOrder: true } },
    },
  });

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Poprawki</h1>
          <p className="mt-1 text-sm text-muted">
            {showAll ? "Wszystkie zgłoszenia (najnowsze pierwsze)." : "Otwarte zgłoszenia od najstarszego – klient czeka na odpowiedź."}
          </p>
        </div>
        <Link href={showAll ? "/admin/poprawki" : "/admin/poprawki?wszystkie=1"} className="btn-secondary min-h-9 py-1.5 text-sm">
          {showAll ? "Tylko otwarte" : "Pokaż wszystkie"}
        </Link>
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Zgłoszono</th>
              <th scope="col" className="px-4 py-3">Zamówienie</th>
              <th scope="col" className="px-4 py-3">Zdjęcie</th>
              <th scope="col" className="px-4 py-3">Treść</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {revisions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  {showAll ? "Brak zgłoszeń poprawek." : "Brak otwartych poprawek – świetna robota!"}
                </td>
              </tr>
            )}
            {revisions.map((revision) => (
              <tr key={revision.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTimePL(revision.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/admin/zamowienia/${revision.order.id}#poprawki`} className="link font-medium">
                    {getOrderNumber(revision.order.id)}
                  </Link>
                  {revision.order.express && <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">ekspres</span>}
                  <span className="block max-w-[14rem] truncate text-xs text-muted">{revision.order.name ?? revision.order.email}</span>
                </td>
                <td className="px-4 py-3">{revision.photo ? `Zdjęcie ${revision.photo.sortOrder + 1}` : "Całe zamówienie"}</td>
                <td className="max-w-md px-4 py-3">
                  <p className="line-clamp-3 whitespace-pre-line">{revision.message}</p>
                  {revision.reply && <p className="mt-1 text-xs text-muted">Odpowiedź: {revision.reply}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REVISION_STATUS_TONES[revision.status] ?? "bg-line"}`}>
                    {REVISION_STATUS_LABELS[revision.status] ?? revision.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
