"use client";

import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

interface CompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  width?: number;
  height?: number;
  label?: string;
  /** Etykieta w prawym górnym rogu (np. „Wariant B”). */
  afterBadge?: string;
  className?: string;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Suwak „przed / po” dla plików zamówienia (/api/files z tokenem). Działa jak BeforeAfterSlider,
 * ale z obrazami `unoptimized` – optymalizator next/image nie przyjmuje lokalnych adresów
 * z parametrami (token, w), a miniatury i tak przygotowuje /api/files.
 * Obsługa: przeciąganie (pointer events) i klawiatura przez natywny <input type="range">.
 */
export function CompareSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  width = 4,
  height = 3,
  label = "Porównanie zdjęcia przed i po wizualizacji",
  afterBadge = "Po",
  className = "",
}: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromClientX(event.clientX);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragging) updateFromClientX(event.clientX);
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      setPosition((p) => clamp(p + (event.key === "PageUp" ? 10 : -10)));
    }
  }

  const rounded = Math.round(position);

  return (
    <div className={`relative select-none ${className}`}>
      <div
        ref={containerRef}
        data-testid="compare-slider"
        className={`relative overflow-hidden rounded-control bg-cream touch-pan-y ${dragging ? "cursor-grabbing" : "cursor-ew-resize"}`}
        style={{ aspectRatio: `${width} / ${height}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          unoptimized
          draggable={false}
          sizes="(min-width: 1024px) 720px, 100vw"
          className="pointer-events-none object-cover"
        />
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image
            src={beforeSrc}
            alt={beforeAlt}
            fill
            unoptimized
            draggable={false}
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
          />
        </div>

        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-white">
          Przed
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-brand/90 px-3 py-1 text-xs font-semibold text-white">
          {afterBadge}
        </span>

        <input
          id={inputId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={rounded}
          onChange={(event) => setPosition(clamp(Number(event.target.value)))}
          onKeyDown={onKeyDown}
          aria-label={label}
          aria-valuetext={`Widoczne ${rounded}% zdjęcia przed i ${100 - rounded}% wizualizacji`}
          className="peer sr-only"
        />

        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.12)]"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-brand shadow-lift peer-focus-visible:ring-4 peer-focus-visible:ring-brand/60"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" focusable="false">
            <path
              d="M9 6 3 12l6 6M15 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
