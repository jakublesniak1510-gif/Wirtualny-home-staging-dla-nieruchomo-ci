"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Stan wgrywania zdjęć w kreatorze (upload przez XHR z paskiem postępu, 3 równolegle). */

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  /** 0–100 */
  progress: number;
  /** Podgląd lokalny (blob:) – od razu po wybraniu pliku. */
  localUrl: string;
  tmpKey?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface UploadResponse {
  tmpKey: string;
  width: number;
  height: number;
  size: number;
  previewUrl: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const CONCURRENCY = 3;

function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
  register: (xhr: XMLHttpRequest) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as (Partial<UploadResponse> & { error?: string }) | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.tmpKey) {
        resolve(body as UploadResponse);
      } else {
        reject(new Error(body?.error ?? `Nie udało się wgrać pliku (błąd ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Błąd połączenia. Sprawdź internet i spróbuj ponownie."));
    xhr.onabort = () => reject(new Error("Przerwano wgrywanie."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function usePhotoUploads({ maxFiles, maxMb }: { maxFiles: number; maxMb: number }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const files = useRef(new Map<string, File>());
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const queue = useRef<string[]>([]);
  const active = useRef(0);
  const itemsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const pump = useCallback(function run() {
    while (active.current < CONCURRENCY && queue.current.length > 0) {
      const id = queue.current.shift();
      const file = id ? files.current.get(id) : undefined;
      if (!id || !file) continue;
      active.current += 1;
      update(id, { status: "uploading", progress: 0 });
      uploadFile(
        file,
        (progress) => update(id, { progress }),
        (xhr) => requests.current.set(id, xhr),
      )
        .then((result) => {
          update(id, {
            status: "done",
            progress: 100,
            tmpKey: result.tmpKey,
            previewUrl: result.previewUrl,
            width: result.width,
            height: result.height,
          });
        })
        .catch((error: unknown) => {
          if (!files.current.has(id)) return; // usunięte w trakcie
          update(id, {
            status: "error",
            error: error instanceof Error ? error.message : "Nie udało się wgrać pliku.",
          });
        })
        .finally(() => {
          requests.current.delete(id);
          active.current -= 1;
          run();
        });
    }
  }, [update]);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list);
      const messages: string[] = [];
      const free = maxFiles - itemsRef.current.length;
      if (free <= 0) {
        setNotice(`Możesz dodać maksymalnie ${maxFiles} ${maxFiles === 1 ? "zdjęcie" : "zdjęć"}.`);
        return;
      }
      const accepted: UploadItem[] = [];
      for (const file of incoming) {
        if (!ACCEPTED.includes(file.type)) {
          messages.push(`„${file.name}” – nieobsługiwany format (dozwolone JPG, PNG, WebP).`);
          continue;
        }
        if (file.size > maxMb * 1024 * 1024) {
          messages.push(`„${file.name}” – plik większy niż ${maxMb} MB.`);
          continue;
        }
        if (accepted.length >= free) {
          messages.push(`Pominięto część plików – limit to ${maxFiles} ${maxFiles === 1 ? "zdjęcie" : "zdjęć"}.`);
          break;
        }
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        files.current.set(id, file);
        accepted.push({
          id,
          name: file.name,
          size: file.size,
          status: "queued",
          progress: 0,
          localUrl: URL.createObjectURL(file),
        });
      }
      setNotice(messages.length > 0 ? messages.join(" ") : null);
      if (accepted.length === 0) return;
      itemsRef.current = [...itemsRef.current, ...accepted];
      setItems((current) => [...current, ...accepted]);
      queue.current.push(...accepted.map((item) => item.id));
      pump();
    },
    [maxFiles, maxMb, pump],
  );

  const remove = useCallback((id: string) => {
    requests.current.get(id)?.abort();
    files.current.delete(id);
    queue.current = queue.current.filter((queued) => queued !== id);
    setItems((current) => {
      const item = current.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.localUrl);
      return current.filter((i) => i.id !== id);
    });
    setNotice(null);
  }, []);

  const retry = useCallback(
    (id: string) => {
      if (!files.current.has(id)) return;
      update(id, { status: "queued", progress: 0, error: undefined });
      queue.current.push(id);
      pump();
    },
    [pump, update],
  );

  useEffect(() => {
    const requestMap = requests.current;
    return () => {
      for (const xhr of requestMap.values()) xhr.abort();
      for (const item of itemsRef.current) URL.revokeObjectURL(item.localUrl);
    };
  }, []);

  const done = items.filter((item) => item.status === "done");
  const pending = items.some((item) => item.status === "queued" || item.status === "uploading");
  const failed = items.filter((item) => item.status === "error").length;

  return { items, done, pending, failed, notice, addFiles, remove, retry };
}

export type PhotoUploads = ReturnType<typeof usePhotoUploads>;
