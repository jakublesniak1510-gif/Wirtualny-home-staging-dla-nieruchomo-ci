import type { ReactNode } from "react";

type SectionTone = "default" | "surface" | "cream" | "brand";

const TONES: Record<SectionTone, string> = {
  default: "bg-paper",
  surface: "bg-surface",
  cream: "bg-cream",
  brand: "bg-brand text-white",
};

interface SectionProps {
  children: ReactNode;
  id?: string;
  tone?: SectionTone;
  className?: string;
  /** Klasy kontenera wewnętrznego. */
  containerClassName?: string;
  /** id nagłówka sekcji – trafia do aria-labelledby. */
  labelledBy?: string;
}

/** Sekcja strony z kontenerem max-w-6xl i pionowymi odstępami. */
export function Section({
  children,
  id,
  tone = "default",
  className = "",
  containerClassName = "",
  labelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`py-16 sm:py-20 lg:py-24 ${TONES[tone]} ${className}`}
    >
      <div className={`container-x ${containerClassName}`}>{children}</div>
    </section>
  );
}
