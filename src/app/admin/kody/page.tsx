import type { Metadata } from "next";
import { PackageCodeForm } from "@/components/admin/PackageCodeForm";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDatePL, formatDateTimePL } from "@/lib/format";
import { isExpired } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Kody pakietów" };

export default async function AdminCodesPage() {
  await requireAdmin();
  const codes = await prisma.packageCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-semibold text-ink">Kody pakietów</h1>
      <p className="mt-1 text-sm text-muted">1 kredyt = 1 zdjęcie bazowe. Dodatki i ekspres klient dopłaca.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Kod</th>
                <th scope="col" className="px-4 py-3">Kredyty</th>
                <th scope="col" className="px-4 py-3">E-mail / notatka</th>
                <th scope="col" className="px-4 py-3">Ważny do</th>
                <th scope="col" className="px-4 py-3">Zamówienia</th>
                <th scope="col" className="px-4 py-3">Utworzono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Brak kodów – utwórz pierwszy formularzem obok.
                  </td>
                </tr>
              )}
              {codes.map((code) => {
                const expired = isExpired(code.expiresAt);
                return (
                  <tr key={code.id} className={expired || code.creditsLeft === 0 ? "text-muted" : ""}>
                    <td className="px-4 py-3 font-mono font-semibold">{code.code}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {code.creditsLeft} / {code.creditsTotal}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{code.email ?? "—"}</span>
                      {code.note && <span className="block text-xs text-muted">{code.note}</span>}
                    </td>
                    <td className={`px-4 py-3 ${expired ? "text-danger" : ""}`}>
                      {code.expiresAt ? formatDatePL(code.expiresAt) : "bezterminowo"}
                      {expired && " (wygasł)"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{code._count.orders}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTimePL(code.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PackageCodeForm />
      </div>
    </div>
  );
}
