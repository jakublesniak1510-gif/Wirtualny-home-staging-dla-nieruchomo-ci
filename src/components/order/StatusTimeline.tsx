import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS, STATUS_TIMELINE, getTimelineIndex } from "@/lib/orders";

/** Oś statusu: Przyjęte → Opłacone → W realizacji → Gotowe → Dostarczone. */
export function StatusTimeline({ status }: { status: OrderStatus }) {
  const current = getTimelineIndex(status);
  return (
    <ol className="grid grid-cols-5 gap-1 sm:gap-2" aria-label="Etapy realizacji zamówienia">
      {STATUS_TIMELINE.map((step, index) => {
        const done = index <= current;
        const isCurrent = index === current;
        return (
          <li key={step} className="flex flex-col items-center text-center" aria-current={isCurrent ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${index === 0 ? "invisible" : done ? "bg-brand" : "bg-line"}`} aria-hidden="true" />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  done ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted"
                } ${isCurrent ? "ring-4 ring-brand/15" : ""}`}
              >
                {done ? (
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                    <path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`h-0.5 flex-1 ${index === STATUS_TIMELINE.length - 1 ? "invisible" : index < current ? "bg-brand" : "bg-line"}`}
                aria-hidden="true"
              />
            </div>
            <span className={`mt-2 text-[11px] leading-tight sm:text-sm ${isCurrent ? "font-semibold text-ink" : done ? "text-ink/80" : "text-muted"}`}>
              {ORDER_STATUS_LABELS[step]}
              {isCurrent && <span className="sr-only"> (bieżący etap)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
