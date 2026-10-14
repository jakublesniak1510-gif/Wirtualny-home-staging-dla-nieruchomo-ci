"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

/** Wgrywanie/podmiana wyniku dla jednego zdjęcia (znak wodny nakłada serwer). */
export function ResultUpload({ photoId, hasResult, disabled }: { photoId: string; hasResult: boolean; disabled?: boolean }) {
  const router = useRouter();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch(`/api/admin/photos/${photoId}/result`, { method: "POST", body: form });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage({ ok: false, text: body.error ?? "Nie udało się wgrać pliku." });
      } else {
        setMessage({ ok: true, text: "Zapisano wynik ze znakiem wodnym." });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(false);
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={`btn-secondary min-h-9 cursor-pointer px-3 py-1.5 text-sm ${busy || disabled ? "pointer-events-none opacity-55" : ""}`}
      >
        {busy ? "Wgrywanie…" : hasResult ? "Podmień wynik" : "Wgraj wynik"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={busy || disabled}
        data-testid={`wynik-${photoId}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      {message && (
        <p className={`mt-1.5 text-xs ${message.ok ? "text-success" : "text-danger"}`} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
