"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { DragEvent } from "react";
import type { PhotoUploads, UploadItem } from "@/components/order/usePhotoUploads";
import { formatFileSize } from "@/lib/file-size";

interface PhotoDropzoneProps {
  uploads: PhotoUploads;
  maxFiles: number;
  maxMb: number;
  minShortSide: number;
  error?: string;
}


function Thumb({ item, index, onRemove, onRetry }: { item: UploadItem; index: number; onRemove: () => void; onRetry: () => void }) {
  const src = item.status === "done" && item.previewUrl ? item.previewUrl : item.localUrl;
  return (
    <li className="card relative overflow-hidden p-0">
      <div className="relative aspect-[4/3] bg-cream">
        <Image src={src} alt={`Zdjęcie ${index + 1}: ${item.name}`} fill unoptimized sizes="200px" className="object-cover" />
        {item.status !== "done" && (
          <div className={`absolute inset-0 ${item.status === "error" ? "bg-danger/70" : "bg-ink/35"}`} aria-hidden="true" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2 py-0.5 text-xs font-semibold text-ink shadow-soft">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-ink shadow-soft hover:bg-surface"
          aria-label={`Usuń zdjęcie ${index + 1} (${item.name})`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="space-y-1.5 p-2.5">
        <p className="truncate text-xs font-medium text-ink" title={item.name}>
          {item.name}
        </p>
        {item.status === "done" && (
          <p className="text-xs text-success">
            ✓ {item.width}×{item.height} px · {formatFileSize(item.size)}
          </p>
        )}
        {(item.status === "uploading" || item.status === "queued") && (
          <div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={`Wgrywanie ${item.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.progress}
            >
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${item.progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{item.status === "queued" ? "W kolejce…" : `Wgrywanie… ${item.progress}%`}</p>
          </div>
        )}
        {item.status === "error" && (
          <div>
            <p className="text-xs text-danger" role="alert">
              {item.error}
            </p>
            <button type="button" onClick={onRetry} className="link mt-1 text-xs">
              Spróbuj ponownie
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function PhotoDropzone({ uploads, maxFiles, maxMb, minShortSide, error }: PhotoDropzoneProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { items, done, pending, notice, addFiles, remove, retry } = uploads;
  const full = items.length >= maxFiles;

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-card border-2 border-dashed px-4 py-8 text-center transition-colors sm:py-10 ${
          dragging ? "border-brand bg-brand-light" : error ? "border-danger bg-surface" : "border-line bg-paper hover:border-brand/60"
        } ${full ? "opacity-60" : ""}`}
      >
        <svg viewBox="0 0 48 48" className="h-10 w-10 text-brand" aria-hidden="true">
          <rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="17" cy="20" r="3.5" fill="currentColor" />
          <path d="M8 34l11-10 8 7 6-5 9 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <p className="mt-3 text-base font-semibold text-ink">
          {full ? "Dodano maksymalną liczbę zdjęć" : "Przeciągnij zdjęcia tutaj"}
        </p>
        <p id={hintId} className="mt-1 max-w-md text-sm text-muted">
          JPG, PNG lub WebP, do {maxMb} MB, krótszy bok min. {minShortSide} px.{" "}
          {maxFiles > 1 ? `Od 1 do ${maxFiles} zdjęć.` : "Jedno zdjęcie."}
        </p>
        <label
          htmlFor={inputId}
          className={`btn-secondary mt-4 ${full ? "pointer-events-none" : ""}`}
          aria-disabled={full}
        >
          Wybierz z dysku lub telefonu
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={maxFiles > 1}
          disabled={full}
          aria-describedby={hintId}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
        <p className="text-muted">
          Dodane: <strong className="text-ink">{items.length}</strong> / {maxFiles}
          {pending && " · trwa wgrywanie…"}
          {!pending && items.length > 0 && done.length === items.length && " · wszystkie wgrane"}
        </p>
      </div>
      {notice && (
        <p className="mt-2 rounded-control bg-sand-light px-3 py-2 text-sm text-sand-dark" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Wgrane zdjęcia">
          {items.map((item, index) => (
            <Thumb
              key={item.id}
              item={item}
              index={index}
              onRemove={() => {
                remove(item.id);
                inputRef.current?.focus();
              }}
              onRetry={() => retry(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
