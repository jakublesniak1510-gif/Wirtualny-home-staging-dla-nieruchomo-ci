import Link from "next/link";
import type { ReactNode } from "react";

interface CtaBannerProps {
  title: ReactNode;
  description?: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  id?: string;
}

/** Zielony baner CTA na końcu podstron (jak na stronie głównej). */
export function CtaBanner({ title, description, primary, secondary, id = "cta-title" }: CtaBannerProps) {
  return (
    <section aria-labelledby={id} className="py-16 sm:py-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-card bg-brand px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-14">
          <h2 id={id} className="mx-auto max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            {title}
          </h2>
          {description && <p className="mx-auto mt-4 max-w-xl text-white/85">{description}</p>}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={primary.href} className="btn-primary bg-white px-6 text-base text-brand hover:bg-brand-light">
              {primary.label}
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="btn-secondary border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
