import type { ReactNode } from "react";

export interface Step {
  title: string;
  description: ReactNode;
}

interface StepsProps {
  steps: readonly Step[];
  className?: string;
}

/** Ponumerowana lista kroków procesu (np. „Jak to działa”). */
export function Steps({ steps, className = "" }: StepsProps) {
  return (
    <ol className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {steps.map((step, index) => (
        <li key={step.title} className="card relative flex flex-col p-6">
          <span
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-semibold text-white"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold text-ink">
            <span className="sr-only">Krok {index + 1}: </span>
            {step.title}
          </h3>
          <div className="mt-2 text-sm leading-relaxed text-muted">{step.description}</div>
        </li>
      ))}
    </ol>
  );
}
