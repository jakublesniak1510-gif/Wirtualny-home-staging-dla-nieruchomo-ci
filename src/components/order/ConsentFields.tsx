"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CONSENT_KEYS, CONSENT_TEXTS } from "@/lib/consents";
import type { ConsentKey } from "@/lib/consents";
import { ROUTES } from "@/lib/site";

export type ConsentState = Record<ConsentKey, boolean>;

export const EMPTY_CONSENTS: ConsentState = { terms: false, digital: false, honesty: false, rights: false };

function renderText(key: ConsentKey): ReactNode {
  if (key !== "terms") return CONSENT_TEXTS[key];
  return (
    <>
      Akceptuję{" "}
      <Link href={ROUTES.terms} className="link" target="_blank">
        Regulamin
      </Link>{" "}
      i{" "}
      <Link href={ROUTES.privacy} className="link" target="_blank">
        Politykę prywatności
      </Link>
      .
    </>
  );
}

interface ConsentFieldsProps {
  value: ConsentState;
  onChange: (value: ConsentState) => void;
  errors?: Partial<Record<ConsentKey, string>>;
}

/** Cztery wymagane zgody (treści z src/lib/consents.ts). */
export function ConsentFields({ value, onChange, errors = {} }: ConsentFieldsProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Wymagane zgody</legend>
      {CONSENT_KEYS.map((key) => (
        <div key={key}>
          <label className="flex cursor-pointer items-start gap-3 rounded-control p-1 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              name={`zgoda-${key}`}
              checked={value[key]}
              onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
              aria-invalid={Boolean(errors[key])}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-brand"
            />
            <span>
              {renderText(key)}
              <span className="text-danger" aria-hidden="true">
                {" "}
                *
              </span>
            </span>
          </label>
          {errors[key] && (
            <p className="ml-9 text-sm font-medium text-danger" role="alert">
              {errors[key]}
            </p>
          )}
        </div>
      ))}
      <button
        type="button"
        className="link ml-1 text-sm"
        onClick={() => onChange({ terms: true, digital: true, honesty: true, rights: true })}
      >
        Zaznacz wszystkie zgody
      </button>
    </fieldset>
  );
}
