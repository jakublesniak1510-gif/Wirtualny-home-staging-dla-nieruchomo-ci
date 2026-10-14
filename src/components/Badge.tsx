import type { ReactNode } from "react";

type BadgeTone = "brand" | "solid" | "sand" | "neutral" | "inverted";

const TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-light text-brand",
  solid: "bg-brand text-white",
  sand: "bg-sand-light text-sand-dark",
  neutral: "bg-surface text-muted border border-line",
  inverted: "bg-white/15 text-white",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "brand", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
