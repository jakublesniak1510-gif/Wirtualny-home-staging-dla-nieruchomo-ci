import { SITE } from "@/lib/site";

interface LogoProps {
  className?: string;
  /** Pokaż nazwę obok znaku (domyślnie tak). */
  withText?: boolean;
  /** Wariant jasny – na ciemne tło. */
  inverted?: boolean;
}

/** Znak: zarys domu z sofą w środku. */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const main = inverted ? "#ffffff" : "var(--color-brand)";
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 14.5 16 4l12 10.5V27a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 4 27V14.5Z"
        fill="none"
        stroke={main}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="9" y="17" width="14" height="5" rx="1.6" fill="var(--color-sand)" />
      <rect x="10.5" y="14" width="11" height="4.5" rx="1.6" fill={main} />
      <path d="M10 22v2.2M22 22v2.2" stroke={main} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "", withText = true, inverted = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" inverted={inverted} />
      {withText && (
        <span
          className={`text-lg font-semibold tracking-tight ${inverted ? "text-white" : "text-ink"}`}
        >
          {SITE.name}
        </span>
      )}
    </span>
  );
}
