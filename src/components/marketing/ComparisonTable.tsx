import { COMPARISON_CRITERIA, COMPARISON_OPTIONS } from "@/content/comparison";
import type { ComparisonCriterion, ComparisonLevel } from "@/content/comparison";

const LEVELS: Record<ComparisonLevel, { label: string; className: string; path: string }> = {
  yes: { label: "Tak", className: "bg-brand-light text-brand", path: "m5 10.5 3.5 3.5L15 7" },
  partial: { label: "Częściowo", className: "bg-sand-light text-sand-dark", path: "M5.5 10h9" },
  no: { label: "Nie", className: "bg-[#f6e3e3] text-danger", path: "M6.5 6.5l7 7M13.5 6.5l-7 7" },
  na: { label: "Nie dotyczy", className: "bg-cream text-muted", path: "M7 13 13 7" },
};

function LevelIcon({ level }: { level: ComparisonLevel }) {
  const meta = LEVELS[level];
  return (
    <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" focusable="false">
        <path d={meta.path} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">{meta.label}:</span>
    </span>
  );
}

interface ComparisonTableProps {
  /** Tylko kryteria oznaczone `onHome` (skrócona wersja na stronę główną). */
  compact?: boolean;
  caption: string;
  className?: string;
}

/** Uczciwa tabela porównawcza: my vs fizyczny staging vs AI „zrób to sam” vs agencja. */
export function ComparisonTable({ compact = false, caption, className = "" }: ComparisonTableProps) {
  const criteria: readonly ComparisonCriterion[] = compact
    ? COMPARISON_CRITERIA.filter((criterion) => criterion.onHome)
    : COMPARISON_CRITERIA;

  return (
    <div className={`card relative overflow-x-auto ${className}`} tabIndex={0} role="region" aria-label={`${caption} (tabela przewijana poziomo)`}>
      <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="sticky left-0 z-10 w-[11rem] bg-surface px-4 py-4 font-medium text-muted">
              Kryterium
            </th>
            {COMPARISON_OPTIONS.map((option) => (
              <th
                key={option.id}
                scope="col"
                className={`px-4 py-4 align-bottom ${option.id === "my" ? "bg-brand-light/70" : ""}`}
              >
                <span className={`block font-semibold ${option.id === "my" ? "text-brand" : "text-ink"}`}>
                  {option.name}
                </span>
                <span className="block text-xs font-normal text-muted">{option.note}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {criteria.map((criterion) => (
            <tr key={criterion.id}>
              <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-4 align-top font-medium text-ink">
                {criterion.label}
                {criterion.hint && <span className="mt-0.5 block text-xs font-normal text-muted">{criterion.hint}</span>}
              </th>
              {COMPARISON_OPTIONS.map((option) => {
                const cell = criterion.cells[option.id];
                return (
                  <td key={option.id} className={`px-4 py-4 align-top ${option.id === "my" ? "bg-brand-light/40" : ""}`}>
                    <span className="flex items-start gap-2">
                      <LevelIcon level={cell.level} />
                      <span className={option.id === "my" ? "text-ink" : "text-ink/85"}>{cell.text}</span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
