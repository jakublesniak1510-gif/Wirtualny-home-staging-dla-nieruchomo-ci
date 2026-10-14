"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { GalleryPhoto } from "./gallery-types";

/** Widok w lightboxie: „przed” (oryginał) albo indeks wariantu. */
export type LightboxView = "before" | number;

export interface LightboxSlide {
  photoIndex: number;
  view: LightboxView;
}

/** Płaska lista slajdów: dla każdego zdjęcia „przed”, a potem wszystkie warianty. */
export function buildSlides(photos: readonly GalleryPhoto[]): LightboxSlide[] {
  return photos.flatMap((photo, photoIndex) => [
    { photoIndex, view: "before" as const },
    ...photo.variants.map((_, index) => ({ photoIndex, view: index })),
  ]);
}

interface LightboxProps {
  photos: readonly GalleryPhoto[];
  slide: LightboxSlide;
  onChange: (slide: LightboxSlide) => void;
  onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Pełnoekranowy podgląd. Klawiatura: Esc – zamknij, ←/→ – poprzedni/następny widok
 * (oryginał i warianty kolejnych zdjęć), Tab zostaje wewnątrz okna (prosta pułapka fokusu).
 */
export function Lightbox({ photos, slide, onChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const slides = buildSlides(photos);
  const position = slides.findIndex((s) => s.photoIndex === slide.photoIndex && s.view === slide.view);
  const photo = photos[slide.photoIndex];

  // Fokus na „Zamknij”, blokada przewijania tła, powrót fokusu po zamknięciu.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  if (!photo) return null;

  const go = (delta: number) => {
    if (slides.length === 0) return;
    const next = slides[(Math.max(0, position) + delta + slides.length) % slides.length];
    if (next) onChange(next);
  };

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Tab") {
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  const variant = slide.view === "before" ? null : photo.variants[slide.view];
  const src = variant ? variant.src : photo.beforeSrc;
  const caption = variant ? variant.label : "Przed (oryginał)";
  const titleId = `lightbox-tytul-${photo.id}`;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex flex-col bg-ink text-white"
      data-testid="lightbox"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p id={titleId} className="text-sm font-semibold">
          Zdjęcie {photo.number} z {photos.length} · <span aria-live="polite">{caption}</span>
        </p>
        <div className="flex items-center gap-2">
          {variant && (
            <a
              href={variant.downloadUrl}
              download={variant.fileName}
              className="rounded-control border border-white/30 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Pobierz
            </a>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-control border border-white/30 px-3 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Zamknij <span className="sr-only">podgląd</span>
            <span aria-hidden="true"> ✕</span>
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <Image
          key={src}
          src={src}
          alt={`Zdjęcie ${photo.number} – ${caption}`}
          fill
          unoptimized
          sizes="100vw"
          className="object-contain p-2 sm:p-6"
        />
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Poprzedni widok"
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl hover:bg-white/25 sm:left-4"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Następny widok"
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl hover:bg-white/25 sm:right-4"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3" role="group" aria-label="Wybierz widok">
        <button
          type="button"
          aria-pressed={slide.view === "before"}
          onClick={() => onChange({ photoIndex: slide.photoIndex, view: "before" })}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${slide.view === "before" ? "bg-white text-ink" : "bg-white/15 hover:bg-white/25"}`}
        >
          Przed
        </button>
        {photo.variants.map((v, index) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={slide.view === index}
            onClick={() => onChange({ photoIndex: slide.photoIndex, view: index })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${slide.view === index ? "bg-white text-ink" : "bg-white/15 hover:bg-white/25"}`}
          >
            {photo.variants.length > 1 ? `Po · ${v.letter}` : "Po"}
          </button>
        ))}
        <p className="w-full text-center text-xs text-white/70">
          Strzałki ← → przełączają widoki, Esc zamyka podgląd.
        </p>
      </div>
    </div>
  );
}
