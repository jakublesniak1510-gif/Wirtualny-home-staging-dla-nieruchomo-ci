import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import { SessionKeepAlive } from "@/components/admin/SessionKeepAlive";
import { isAdminSession } from "@/lib/admin-auth";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Panel", template: `%s – panel | ${SITE.name}` },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Zamówienia" },
  { href: "/admin/poprawki", label: "Poprawki" },
  { href: "/admin/polecenia", label: "Polecenia" },
  { href: "/admin/kody", label: "Kody pakietów" },
  { href: "/admin/zgloszenia", label: "Zgłoszenia" },
  { href: "/admin/ustawienia", label: "Ustawienia" },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const loggedIn = await isAdminSession();
  return (
    <div className="pb-16">
      <div className="border-b border-line bg-surface">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">Panel operatora</p>
          {loggedIn && (
            <nav aria-label="Panel administratora" className="flex flex-wrap items-center gap-1">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-cream hover:text-ink">
                  {item.label}
                </Link>
              ))}
              <form action={logoutAction}>
                <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10">
                  Wyloguj
                </button>
              </form>
            </nav>
          )}
        </div>
      </div>
      {loggedIn && <SessionKeepAlive />}
      {children}
    </div>
  );
}
