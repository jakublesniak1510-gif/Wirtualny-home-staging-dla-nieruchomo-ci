import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: ReactNode;
  /** Mały nadtytuł nad nagłówkiem. */
  eyebrow?: string;
  description?: ReactNode;
  align?: "left" | "center";
  /** id nagłówka (do aria-labelledby sekcji). */
  id?: string;
  as?: "h1" | "h2" | "h3";
  /** Na ciemnym tle (sekcja tone="brand"). */
  inverted?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  eyebrow,
  description,
  align = "left",
  id,
  as: Tag = "h2",
  inverted = false,
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow && (
        <p
          className={`mb-3 text-sm font-semibold uppercase tracking-[0.12em] ${inverted ? "text-sand-light" : "text-sand-dark"}`}
        >
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className={`text-3xl font-semibold leading-tight sm:text-4xl ${inverted ? "text-white" : "text-ink"}`}
      >
        {title}
      </Tag>
      {description && (
        <div
          className={`mt-4 text-base leading-relaxed sm:text-lg ${inverted ? "text-white/85" : "text-muted"}`}
        >
          {description}
        </div>
      )}
    </div>
  );
}
