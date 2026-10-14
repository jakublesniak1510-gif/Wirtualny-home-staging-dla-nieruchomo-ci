"use client";

import Image from "next/image";
import { useState } from "react";
import { CompareSlider } from "./CompareSlider";
import { Lightbox } from "./Lightbox";
import type { LightboxSlide } from "./Lightbox";
import type { GalleryPhoto } from "./gallery-types";

interface OrderGalleryProps {
  photos: GalleryPhoto[];
  /** Adres ZIP ze wszystkimi wariantami (null, gdy nic nie jest gotowe). */
  zipUrl: string | null;
  /** Tekst dla zdjęć bez wyniku (np. „Wizualizacja w przygotowaniu”). */
  pendingText: string;
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Karty zdjęć: suwak przed/po, miniatury wariantów, pobieranie i podgląd pełnoekranowy. */
export function OrderGallery({ photos, zipUrl, pendingText }: OrderGalleryProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<LightboxSlide | null>(null);

  const openLightbox = (slide: LightboxSlide) => setLightbox(slide);
  const changeSlide = (slide: LightboxSlide) => {
    setLightbox(slide);
    // Wybór wariantu w lightboxie przenosimy też do karty zdjęcia.
    const photo = photos[slide.photoIndex];
    if (photo && slide.view !== "before") {
      const view = slide.view;
      setSelected((prev) => ({ ...prev, [photo.id]: view }));
    }
  };

  return (
    <>
      <ul className="mt-4 space-y-6">
        {photos.map((photo, photoIndex) => {
          const current = Math.min(selected[photo.id] ?? 0, Math.max(0, photo.variants.length - 1));
          const variant = photo.variants[current];
          const multi = photo.variants.length > 1;
          return (
            <li key={photo.id} className="card p-4 sm:p-5" data-testid="photo-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-ink">
                  Zdjęcie {photo.number}
                  <span className="ml-2 text-sm font-normal text-muted">{photo.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openLightbox({ photoIndex, view: variant ? current : "before" })}
                  className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
                >
                  <ExpandIcon />
                  Pełny ekran
                </button>
              </div>

              {variant ? (
                <CompareSlider
                  beforeSrc={photo.beforeSrc}
                  afterSrc={variant.src}
                  beforeAlt={`Zdjęcie ${photo.number} – oryginał`}
                  afterAlt={`Zdjęcie ${photo.number} – ${variant.label}`}
                  width={photo.width}
                  height={photo.height}
                  afterBadge={multi ? `Po · ${variant.letter}` : "Po"}
                  label={`Zdjęcie ${photo.number}: porównanie oryginału i wizualizacji (${variant.label})`}
                />
              ) : (
                <div
                  className="relative overflow-hidden rounded-control bg-cream"
                  style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                >
                  <Image
                    src={photo.beforeSrc}
                    alt={`Zdjęcie ${photo.number} – oryginał`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 720px, 100vw"
                    className="object-cover opacity-60"
                  />
                  <p className="absolute inset-x-4 bottom-4 rounded-control bg-surface/95 px-4 py-3 text-center text-sm font-medium text-ink shadow-soft">
                    {pendingText}
                  </p>
                </div>
              )}

              {photo.variants.length > 0 && (
                <>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted" id={`warianty-${photo.id}`}>
                      {multi ? `Warianty (${photo.variants.length}) – kliknij, aby porównać` : "Wizualizacja"}
                    </p>
                    <div
                      className="mt-2 flex gap-3 overflow-x-auto pb-1"
                      role="group"
                      aria-labelledby={`warianty-${photo.id}`}
                    >
                      {photo.variants.map((v, index) => {
                        const active = index === current;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setSelected((prev) => ({ ...prev, [photo.id]: index }))}
                            className={`group w-28 shrink-0 rounded-control border-2 p-1 text-left transition sm:w-32 ${
                              active ? "border-brand bg-brand-light" : "border-line bg-surface hover:border-brand/50"
                            }`}
                            data-testid="variant-thumb"
                          >
                            <span className="relative block aspect-[4/3] overflow-hidden rounded-[8px] bg-cream">
                              <Image src={v.thumb} alt="" fill unoptimized sizes="128px" className="object-cover" />
                            </span>
                            <span className={`mt-1 block truncate px-1 text-xs ${active ? "font-semibold text-brand" : "text-ink"}`}>
                              {v.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {variant && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <a href={variant.downloadUrl} download={variant.fileName} className="btn-primary" data-testid="download-variant">
                        Pobierz {multi ? `wariant ${variant.letter}` : "wizualizację"}
                      </a>
                      {zipUrl && (
                        <a href={zipUrl} download className="btn-secondary">
                          Pobierz wszystkie (ZIP)
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {lightbox && (
        <Lightbox photos={photos} slide={lightbox} onChange={changeSlide} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
