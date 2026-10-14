import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Etykieta + pole + podpowiedź/błąd. Pole dostaje aria-describedby `${id}-opis`. */
export function FormField({ id, label, error, hint, required, children, className = "" }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-muted"> (opcjonalnie)</span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      <div id={`${id}-opis`}>
        {error ? (
          <p className="mt-1.5 text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Klasy pól tekstowych zgodne z designem. */
export const inputClass =
  "block w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 shadow-[inset_0_1px_2px_rgb(28_28_30/0.04)] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 aria-[invalid=true]:border-danger";
