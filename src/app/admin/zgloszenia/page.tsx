import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTimePL } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Zgłoszenia" };

const TYPE_LABELS: Record<string, string> = {
  contact: "Kontakt",
  office: "Dla biur",
  sample: "Próbka",
};

export default async function AdminRequestsPage() {
  await requireAdmin();
  const requests = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 300 });

  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-semibold text-ink">Zgłoszenia z formularzy</h1>
      <p className="mt-1 text-sm text-muted">Formularze „Kontakt” i „Dla biur” (tylko odczyt).</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Typ</th>
              <th scope="col" className="px-4 py-3">Nadawca</th>
              <th scope="col" className="px-4 py-3">Wiadomość</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Brak zgłoszeń.
                </td>
              </tr>
            )}
            {requests.map((request) => (
              <tr key={request.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTimePL(request.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold">{TYPE_LABELS[request.type] ?? request.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium">{request.name}</span>
                  <a className="link block text-xs" href={`mailto:${request.email}`}>
                    {request.email}
                  </a>
                  {request.phone && <span className="block text-xs text-muted">{request.phone}</span>}
                  {request.company && <span className="block text-xs text-muted">{request.company}</span>}
                </td>
                <td className="max-w-xl px-4 py-3">
                  <p className="whitespace-pre-line">{request.message ?? "—"}</p>
                  {request.payload && (
                    <details className="mt-1 text-xs text-muted">
                      <summary className="cursor-pointer">Dodatkowe pola</summary>
                      <pre className="mt-1 whitespace-pre-wrap break-words font-mono">{request.payload}</pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
