import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { MAIN_NAV, ROUTES, SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href={ROUTES.home} className="rounded-md" aria-label={`${SITE.name} – strona główna`}>
          <Logo />
        </Link>

        <nav aria-label="Główna nawigacja" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-cream hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={ROUTES.order} className="btn-primary min-h-10 px-3.5 py-2 sm:px-5">
            Zamów
          </Link>
          <MobileMenu items={MAIN_NAV} orderHref={ROUTES.order} />
        </div>
      </div>
    </header>
  );
}
