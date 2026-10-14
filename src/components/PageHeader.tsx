import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  /** Mały nadtytuł nad H1. */
  eyebrow?: string;
  description?: ReactNode;
  /** Przyciski / linki pod opisem. */
  actions?: ReactNode;
  /** Dodatkowa treść po prawej stronie (np. karta z ceną) – od lg. */
  aside?: ReactNode;
  /** Okruszki nad nagłówkiem (np. <Breadcrumbs />). */
  breadcrumbs?: ReactNode;
  className?: string;
}

/** Nagłówek podstrony (H1) w stylu hero ze strony głównej, ale niższy. */
export function PageHeader({ title, eyebrow, description, actions, aside, breadcrumbs, className = "" }: PageHeaderProps) {
  return (
    <section className={`border-b border-line bg-cream/60 pb-12 pt-10 sm:pb-16 sm:pt-14 ${className}`}>
      <div className={`container-x ${aside ? "grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]" : ""}`}>
        <div className="max-w-3xl">
          {breadcrumbs && <div className="mb-5">{breadcrumbs}</div>}
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">{eyebrow}</p>
          )}
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">{title}</h1>
          {description && (
            <div className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{description}</div>
          )}
          {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        </div>
        {aside && <div>{aside}</div>}
      </div>
    </section>
  );
}
