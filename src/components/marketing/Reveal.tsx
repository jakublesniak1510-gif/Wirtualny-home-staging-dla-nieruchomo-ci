"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Opóźnienie animacji w ms (np. dla kolejnych kart). */
  delay?: number;
}

/**
 * Subtelne wejście (fade + przesunięcie) przy przewinięciu do elementu.
 * - Treść jest widoczna bez JS i w pierwszym renderze (SEO, brak „mrugnięcia” nad zgięciem):
 *   ukrywamy tylko elementy, które w chwili montowania są poniżej ekranu.
 * - prefers-reduced-motion: brak animacji (obsługa także w CSS – .reveal w globals.css).
 * - Bez bibliotek: IntersectionObserver + atrybut data-reveal ustawiany bezpośrednio na DOM.
 */
export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Pokaż także, gdy przewinięto szybko poza element (jest już nad ekranem).
          if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) continue;
          el.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    // Wydruk strony: pokaż wszystko.
    const onBeforePrint = () => {
      el.dataset.reveal = "shown";
    };
    window.addEventListener("beforeprint", onBeforePrint);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, []);

  const style: CSSProperties | undefined = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
