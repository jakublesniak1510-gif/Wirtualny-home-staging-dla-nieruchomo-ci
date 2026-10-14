import type { ReactNode } from "react";

export interface LegalSectionDef {
  /** Kotwica, np. "postanowienia-ogolne". */
  id: string;
  /** Nagłówek bez numeru, np. „Postanowienia ogólne”. */
  title: string;
  content: ReactNode;
}

interface LegalDocumentProps {
  title: string;
  /** Linia pod tytułem, np. „Obowiązuje od 1 listopada 2026 r.” */
  meta: ReactNode;
  intro?: ReactNode;
  sections: readonly LegalSectionDef[];
  /** Prefiks numeracji sekcji: „§” (regulamin) albo "" (polityka – same numery). */
  numberPrefix?: string;
}

/**
 * Układ dokumentu prawnego: nagłówek, spis treści z kotwicami i ponumerowane sekcje.
 * Typografia list i akapitów ustawiona klasami potomków (bez wtyczki typography).
 */
export function LegalDocument({ title, meta, intro, sections, numberPrefix = "§" }: LegalDocumentProps) {
  const label = (index: number) => (numberPrefix ? `${numberPrefix} ${index + 1}.` : `${index + 1}.`);

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Spis treści" className="card p-5">
            <p className="text-sm font-semibold text-ink">Spis treści</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex gap-2 text-muted hover:text-brand hover:underline">
                    <span className="w-8 shrink-0 tabular-nums">{label(index)}</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <header className="border-b border-line pb-8">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">{title}</h1>
            <p className="mt-4 text-sm text-muted">{meta}</p>
            {intro && <div className="mt-6 space-y-3 leading-relaxed text-ink/90">{intro}</div>}
          </header>

          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-tytul`}
              className="border-b border-line py-8 last:border-b-0"
            >
              <h2 id={`${section.id}-tytul`} className="text-xl font-semibold text-ink sm:text-2xl">
                <span className="mr-2 text-sand-dark">{label(index)}</span>
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink/90 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol_ol]:mt-2 [&_ol_ol]:list-[lower-alpha] [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
                {section.content}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
