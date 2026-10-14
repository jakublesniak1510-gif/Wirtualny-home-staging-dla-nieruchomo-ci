import type { FaqItem } from "@/content/faq";

interface FaqAccordionProps {
  items: readonly FaqItem[];
  /** Otwórz pierwsze pytanie domyślnie. */
  openFirst?: boolean;
  className?: string;
}

/**
 * Akordeon FAQ na natywnych <details>/<summary> – działa bez JavaScriptu,
 * jest dostępny z klawiatury i dla czytników ekranu.
 */
export function FaqAccordion({ items, openFirst = false, className = "" }: FaqAccordionProps) {
  return (
    <div className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-surface ${className}`}>
      {items.map((item, index) => (
        <details key={item.id} id={`faq-${item.id}`} className="group" open={openFirst && index === 0}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left font-semibold text-ink hover:bg-cream/60 sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 h-5 w-5 shrink-0 text-brand transition-transform duration-200 group-open:rotate-45"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="space-y-3 px-5 pb-5 text-[0.9375rem] leading-relaxed text-muted sm:px-6">
            {item.answer.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
