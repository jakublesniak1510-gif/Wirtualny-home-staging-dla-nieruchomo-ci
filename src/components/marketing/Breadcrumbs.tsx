import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import type { BreadcrumbItem } from "@/components/JsonLd";
import { ROUTES } from "@/lib/site";

/** Widoczne okruszki + BreadcrumbList JSON-LD. Ostatni element = bieżąca strona (bez linku). */
export function Breadcrumbs({ items, className = "" }: { items: readonly BreadcrumbItem[]; className?: string }) {
  const all: readonly BreadcrumbItem[] = [{ name: "Strona główna", path: ROUTES.home }, ...items];
  return (
    <>
      <BreadcrumbJsonLd items={items} />
      <nav aria-label="Okruszki" className={`text-sm text-muted ${className}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((item, index) => {
            const last = index === all.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-ink">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="hover:text-brand hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
