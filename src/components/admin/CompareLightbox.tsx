"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface CompareLightboxProps {
  title: string;
  originalUrl: string;
  variantUrl: string;
  onClose: () => void;
}

/** Podgląd pełnoekranowy: oryginał i wariant obok siebie (lub przełączanie na wąskim ekranie). */
export function CompareLightbox({ title, originalUrl, variantUrl, onClose }: CompareLightboxProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        setShowOriginal((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col bg-ink/90 p-3 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="lightbox"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-white">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-control border border-white/40 px-3 py-1.5 text-sm hover:bg-white/10 lg:hidden"
            onClick={() => setShowOriginal((value) => !value)}
          >
            {showOriginal ? "Pokaż wariant" : "Pokaż oryginał"}
          </button>
          <button ref={closeRef} type="button" className="rounded-control bg-white px-3 py-1.5 text-sm font-semibold text-ink" onClick={onClose}>
            Zamknij (Esc)
          </button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <figure className={`relative min-h-0 ${showOriginal ? "" : "hidden lg:block"}`}>
          <Image src={originalUrl} alt="Oryginał" fill unoptimized sizes="50vw" className="object-contain" />
          <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">Oryginał</figcaption>
        </figure>
        <figure className={`relative min-h-0 ${showOriginal ? "hidden lg:block" : ""}`}>
          <Image src={variantUrl} alt="Wariant AI" fill unoptimized sizes="50vw" className="object-contain" />
          <figcaption className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">Wariant AI</figcaption>
        </figure>
      </div>
      <p className="mt-2 text-center text-xs text-white/70">
        Sprawdź: okna, drzwi i ściany bez zmian, wady widoczne, meble w realnej skali. Spacja – przełącz widok.
      </p>
    </div>
  );
}
