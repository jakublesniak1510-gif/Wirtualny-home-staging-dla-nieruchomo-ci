"use client";

import { useEffect, useState } from "react";

/** Przycisk kopiowania tekstu do schowka (np. linku polecającego) z potwierdzeniem. */
export function CopyButton({
  text,
  label = "Kopiuj link",
  className = "btn-secondary",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <span aria-live="polite">
        {state === "copied" ? "Skopiowano!" : state === "error" ? "Skopiuj ręcznie powyżej" : label}
      </span>
    </button>
  );
}
