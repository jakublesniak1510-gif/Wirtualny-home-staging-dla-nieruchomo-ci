"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { findDuplicateTargets, matchFilesToPhotos } from "@/lib/admin-bulk-match";
import type { FileAssignment, MatchMode } from "@/lib/admin-bulk-match";

interface BulkPhoto {
  id: string;
  index: number;
  name: string;
  hasResult: boolean;
}

interface Selected {
  file: File;
  previewUrl: string;
}

type Progress = { done: number; total: number; errors: string[] } | null;

/**
 * Upload zbiorczy wyników głównych dla całego zamówienia: dopasowanie po numerze w nazwie
 * (`01`, `02`…) albo po kolejności nazw, podgląd i ręczna korekta przed zatwierdzeniem.
 */
export function BulkResultUpload({ photos, disabled }: { photos: BulkPhoto[]; disabled: boolean }) {
  const router = useRouter();
  const inputId = useId();
  const [files, setFiles] = useState<Selected[]>([]);
  const [assignments, setAssignments] = useState<FileAssignment[]>([]);
  const [mode, setMode] = useState<MatchMode>("order");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress>(null);

  useEffect(() => () => files.forEach((item) => URL.revokeObjectURL(item.previewUrl)), [files]);

  function choose(list: FileList | null) {
    if (!list || list.length === 0) return;
    const chosen = [...list].map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    const match = matchFilesToPhotos(chosen.map((item) => item.file.name), photos.length);
    setFiles(chosen);
    setAssignments(match.assignments);
    setMode(match.mode);
    setProgress(null);
  }

  function reset() {
    setFiles([]);
    setAssignments([]);
  }

  async function submit() {
    const work = assignments.filter((item): item is { fileIndex: number; photoIndex: number } => item.photoIndex !== null);
    setBusy(true);
    const errors: string[] = [];
    setProgress({ done: 0, total: work.length, errors });
    for (const [position, item] of work.entries()) {
      const photo = photos[item.photoIndex];
      const form = new FormData();
      form.append("file", files[item.fileIndex].file);
      try {
        const response = await fetch(`/api/admin/photos/${photo.id}/result`, { method: "POST", body: form });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          errors.push(`Zdjęcie ${photo.index + 1}: ${body.error ?? "błąd zapisu"}`);
        }
      } catch {
        errors.push(`Zdjęcie ${photo.index + 1}: błąd połączenia`);
      }
      setProgress({ done: position + 1, total: work.length, errors: [...errors] });
    }
    setBusy(false);
    if (errors.length === 0) reset();
    router.refresh();
  }

  const duplicates = findDuplicateTargets(assignments);
  const assignedCount = assignments.filter((item) => item.photoIndex !== null).length;
  const replacing = assignments.filter((item) => item.photoIndex !== null && photos[item.photoIndex]?.hasResult).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className={`btn-secondary min-h-10 cursor-pointer py-2 text-sm ${disabled || busy ? "pointer-events-none opacity-55" : ""}`}
        >
          Wybierz pliki wyników…
        </label>
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || busy}
          data-testid="upload-zbiorczy"
          onChange={(event) => {
            choose(event.target.files);
            event.target.value = "";
          }}
        />
        <p className="text-xs text-muted">
          Nazwy z numerem zdjęcia (<code>01.jpg</code>, <code>salon-02.png</code>) dopasujemy po numerze, inne – po kolejności nazw.
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 rounded-control border border-line p-3" data-testid="podglad-dopasowania">
          <p className="text-sm text-ink">
            Dopasowanie: <strong>{mode === "number" ? "po numerze w nazwie pliku" : "po kolejności nazw"}</strong> · {assignedCount} z {files.length} plików
            przypisanych
            {replacing > 0 && <span className="text-sand-dark"> · {replacing} podmieni istniejące wyniki</span>}
          </p>
          <ul className="mt-2 divide-y divide-line">
            {files.map((item, fileIndex) => {
              const assignment = assignments[fileIndex];
              const duplicate = assignment?.photoIndex !== null && assignment?.photoIndex !== undefined && duplicates.includes(assignment.photoIndex);
              return (
                <li key={`${item.file.name}-${fileIndex}`} className="flex flex-wrap items-center gap-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- lokalny podgląd blob: przed wysłaniem */}
                  <img src={item.previewUrl} alt="" className="h-12 w-16 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm">{item.file.name}</span>
                  <span aria-hidden="true" className="text-muted">→</span>
                  <select
                    aria-label={`Zdjęcie docelowe dla pliku ${item.file.name}`}
                    value={assignment?.photoIndex ?? ""}
                    onChange={(event) => {
                      const value = event.target.value === "" ? null : Number(event.target.value);
                      setAssignments((list) => list.map((entry) => (entry.fileIndex === fileIndex ? { fileIndex, photoIndex: value } : entry)));
                    }}
                    className={`rounded-control border bg-surface px-2 py-1.5 text-sm ${duplicate ? "border-danger" : "border-line"}`}
                  >
                    <option value="">— pomiń —</option>
                    {photos.map((photo) => (
                      <option key={photo.id} value={photo.index}>
                        Zdjęcie {photo.index + 1} ({photo.name.slice(0, 30)})
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
          {duplicates.length > 0 && (
            <p className="mt-2 text-sm text-danger" role="alert">
              Kilka plików wskazuje to samo zdjęcie ({duplicates.map((index) => index + 1).join(", ")}) – popraw przypisanie.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary min-h-10 py-2 text-sm" disabled={busy || assignedCount === 0 || duplicates.length > 0} onClick={() => void submit()}>
              {busy ? "Wgrywanie…" : `Zatwierdź i wgraj (${assignedCount})`}
            </button>
            <button type="button" className="btn-secondary min-h-10 py-2 text-sm" disabled={busy} onClick={reset}>
              Anuluj
            </button>
          </div>
        </div>
      )}
      {progress && (
        <div className="mt-2 text-sm" role="status" aria-live="polite">
          <p className={progress.errors.length > 0 ? "text-danger" : "text-success"}>
            Wgrano {progress.done - progress.errors.length} z {progress.total}
            {progress.done === progress.total && progress.errors.length === 0 ? " – gotowe, znak wodny dodany." : ""}
          </p>
          {progress.errors.map((error) => (
            <p key={error} className="text-xs text-danger">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
