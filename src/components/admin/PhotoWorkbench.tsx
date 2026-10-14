"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { CompareLightbox } from "@/components/admin/CompareLightbox";
import { ResultUpload } from "@/components/admin/ResultUpload";
import type { ProviderSummary } from "@/lib/ai/index";
import type { AiVariantView, PhotoResultView } from "@/lib/ai/view";
import { formatPLN } from "@/lib/format";

export interface WorkbenchPhoto {
  id: string;
  index: number;
  name: string;
  meta: string;
  originalUrl: string;
  originalThumbUrl: string;
  originalDownloadUrl: string;
  resultUrl: string | null;
  resultThumbUrl: string | null;
  resultDownloadUrl: string | null;
  resultInfo: string;
}

interface PhotoWorkbenchProps {
  photo: WorkbenchPhoto;
  results: PhotoResultView[];
  initialVariants: AiVariantView[];
  defaultPrompt: string;
  providers: ProviderSummary[];
  defaultProviderId: string | null;
  defaultCount: number;
  disabled: boolean;
}

type Message = { ok: boolean; text: string } | null;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "W kolejce",
  RUNNING: "Generowanie…",
  DONE: "Gotowy",
  FAILED: "Błąd",
};

const VARIANT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function isActive(variant: AiVariantView): boolean {
  return variant.status === "PENDING" || variant.status === "RUNNING";
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

/** Stanowisko pracy dla jednego zdjęcia: oryginał, prompt, generowanie wariantów AI, publikacja wyników. */
export function PhotoWorkbench({
  photo,
  results,
  initialVariants,
  defaultPrompt,
  providers,
  defaultProviderId,
  defaultCount,
  disabled,
}: PhotoWorkbenchProps) {
  const router = useRouter();
  const ids = useId();
  const configured = providers.filter((provider) => provider.configured);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [providerId, setProviderId] = useState(defaultProviderId ?? configured[0]?.id ?? "");
  const [count, setCount] = useState(defaultCount);
  const [variants, setVariants] = useState(initialVariants);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<AiVariantView | null>(null);
  const [extraLabel, setExtraLabel] = useState("");
  /** Edytowane (niezapisane) etykiety wariantów klienta; brak wpisu = etykieta z bazy. */
  const [resultLabels, setResultLabels] = useState<Record<string, string>>({});
  const labelOf = (result: PhotoResultView) => resultLabels[result.id] ?? result.label ?? "";
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const refreshVariants = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}/variants`, { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { variants: AiVariantView[] };
      setVariants(body.variants);
    } catch {
      // chwilowy brak sieci – kolejna próba za 3 s
    }
  }, [photo.id]);

  const pending = variants.some(isActive);
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => void refreshVariants(), 3000);
    return () => clearInterval(timer);
  }, [pending, refreshVariants]);

  async function generate() {
    setBusy("generate");
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, providerId, prompt: prompt.trim() === defaultPrompt.trim() ? undefined : prompt }),
      });
      if (!response.ok) {
        setMessage({ ok: false, text: await readError(response, "Nie udało się uruchomić generowania.") });
      } else {
        setMessage({ ok: true, text: response.status === 202 ? "Generowanie w toku – wyniki pojawią się poniżej." : "Warianty wygenerowane." });
        await refreshVariants();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  async function publish(variant: AiVariantView, asPrimary: boolean, letter: string) {
    setBusy(`publish-${variant.id}-${asPrimary ? "p" : "v"}`);
    setMessage(null);
    try {
      const label = asPrimary ? undefined : (labels[variant.id] ?? `Wariant ${letter}`).trim();
      const response = await fetch(`/api/admin/ai-variants/${variant.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asPrimary, label }),
      });
      if (!response.ok) {
        setMessage({ ok: false, text: await readError(response, "Nie udało się opublikować wariantu.") });
      } else {
        setMessage({ ok: true, text: asPrimary ? "Ustawiono wynik główny (ze znakiem wodnym)." : "Dodano wariant dla klienta (ze znakiem wodnym)." });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  async function removeVariant(variant: AiVariantView) {
    if (!window.confirm("Usunąć ten wariant AI?")) return;
    setBusy(`delete-${variant.id}`);
    try {
      const response = await fetch(`/api/admin/ai-variants/${variant.id}`, { method: "DELETE" });
      if (!response.ok) setMessage({ ok: false, text: await readError(response, "Nie udało się usunąć wariantu.") });
      else setVariants((list) => list.filter((item) => item.id !== variant.id));
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  async function uploadExtra(file: File) {
    setBusy("extra");
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    form.append("label", extraLabel);
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}/results`, { method: "POST", body: form });
      if (!response.ok) setMessage({ ok: false, text: await readError(response, "Nie udało się wgrać wariantu.") });
      else {
        setMessage({ ok: true, text: "Dodano wariant dla klienta (ze znakiem wodnym)." });
        setExtraLabel("");
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  async function saveResultLabel(result: PhotoResultView) {
    setBusy(`label-${result.id}`);
    try {
      const response = await fetch(`/api/admin/photo-results/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: labelOf(result) }),
      });
      if (!response.ok) setMessage({ ok: false, text: await readError(response, "Nie udało się zapisać etykiety.") });
      else {
        setMessage({ ok: true, text: "Zapisano etykietę." });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  async function removeResult(result: PhotoResultView) {
    if (!window.confirm("Usunąć ten wariant? Klient przestanie go widzieć.")) return;
    setBusy(`remove-${result.id}`);
    try {
      const response = await fetch(`/api/admin/photo-results/${result.id}`, { method: "DELETE" });
      if (!response.ok) setMessage({ ok: false, text: await readError(response, "Nie udało się usunąć wariantu.") });
      else router.refresh();
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(null);
  }

  const selectedProvider = providers.find((provider) => provider.id === providerId);
  const canGenerate = !disabled && Boolean(selectedProvider?.configured) && busy === null;
  const doneCount = variants.filter((variant) => variant.status === "DONE").length;

  return (
    <li className="card p-4 sm:p-5" data-testid={`zdjecie-${photo.index + 1}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">
          Zdjęcie {photo.index + 1} <span className="font-normal text-muted">· {photo.name}</span>
        </h3>
        <p className="text-xs text-muted">{photo.meta}</p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        <figure>
          <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-cream">
            <Image src={photo.originalThumbUrl} alt={`Oryginał zdjęcia ${photo.index + 1}`} fill unoptimized sizes="400px" className="object-cover" />
          </div>
          <figcaption className="mt-1.5 flex justify-between gap-2 text-xs text-muted">
            <span>Oryginał</span>
            <a className="link" href={photo.originalDownloadUrl}>
              Pobierz oryginał
            </a>
          </figcaption>
        </figure>

        <figure>
          <div className="relative aspect-[4/3] overflow-hidden rounded-control border border-dashed border-line bg-paper">
            {photo.resultThumbUrl ? (
              <Image src={photo.resultThumbUrl} alt={`Wynik główny zdjęcia ${photo.index + 1}`} fill unoptimized sizes="400px" className="object-contain" data-testid="wynik-glowny" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">Brak wyniku głównego</div>
            )}
          </div>
          <figcaption className="mt-1.5 flex flex-wrap items-start justify-between gap-2 text-xs text-muted">
            <span>
              Wynik główny · {photo.resultInfo}
              {photo.resultDownloadUrl && (
                <>
                  {" · "}
                  <a className="link" href={photo.resultDownloadUrl}>
                    Pobierz
                  </a>
                </>
              )}
            </span>
            <ResultUpload photoId={photo.id} hasResult={Boolean(photo.resultUrl)} disabled={disabled} />
          </figcaption>
        </figure>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${ids}-prompt`} className="text-xs font-semibold uppercase tracking-wide text-muted">
                Prompt dla AI
              </label>
              {prompt !== defaultPrompt && (
                <button type="button" className="text-xs font-medium text-brand underline" onClick={() => setPrompt(defaultPrompt)}>
                  Przywróć domyślny
                </button>
              )}
            </div>
            <textarea
              id={`${ids}-prompt`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
              maxLength={4000}
              spellCheck={false}
              className="mt-1 block w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs">
              <span className="block font-semibold uppercase tracking-wide text-muted">Dostawca</span>
              <select
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                className="mt-1 rounded-control border border-line bg-surface px-2.5 py-2 text-sm"
                data-testid="dostawca"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id} disabled={!provider.configured}>
                    {provider.label}
                    {provider.configured ? "" : " – brak klucza"}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="block font-semibold uppercase tracking-wide text-muted">Warianty</span>
              <select
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="mt-1 rounded-control border border-line bg-surface px-2.5 py-2 text-sm"
                data-testid="liczba-wariantow"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-primary min-h-10 py-2 text-sm" disabled={!canGenerate} onClick={() => void generate()}>
              {busy === "generate" ? "Uruchamianie…" : "Generuj warianty"}
            </button>
          </div>
          {configured.length === 0 && (
            <p className="rounded-control bg-sand-light p-3 text-xs text-sand-dark" data-testid="brak-klucza-ai">
              <strong>Skonfiguruj klucz API w .env</strong> – ustaw <code>REPLICATE_API_TOKEN</code>, <code>OPENAI_API_KEY</code> lub{" "}
              <code>GEMINI_API_KEY</code> (oraz <code>AI_PROVIDER</code>) i uruchom serwer ponownie. Do tego czasu wgrywaj wyniki ręcznie.
            </p>
          )}
          {selectedProvider && <p className="text-xs text-muted">Model: {selectedProvider.model}</p>}
        </div>
      </div>

      {message && (
        <p className={`mt-3 text-sm font-medium ${message.ok ? "text-success" : "text-danger"}`} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}

      {variants.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-ink">
            Warianty AI <span className="font-normal text-muted">({doneCount} gotowe z {variants.length}) – bez znaku wodnego, widoczne tylko dla Ciebie</span>
          </h4>
          <ul className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="warianty-ai">
            {variants.map((variant, position) => {
              const letter = VARIANT_LETTERS[(variants.length - 1 - position) % VARIANT_LETTERS.length];
              return (
                <li key={variant.id} className="min-w-0 rounded-control border border-line bg-paper p-2.5" data-testid="wariant-ai" data-status={variant.status}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-cream">
                    {variant.status === "DONE" && variant.thumbUrl && variant.url ? (
                      <button type="button" className="absolute inset-0 cursor-zoom-in" onClick={() => setLightbox(variant)} aria-label={`Powiększ wariant ${letter} i porównaj z oryginałem`}>
                        <Image src={variant.thumbUrl} alt={`Wariant AI ${letter}`} fill unoptimized sizes="320px" className="object-cover" />
                      </button>
                    ) : isActive(variant) ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted">
                        <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand/25 border-t-brand" aria-hidden="true" />
                        {STATUS_LABELS[variant.status]}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center p-3 text-center text-xs text-danger" role="alert">
                        {variant.error ?? "Generowanie nie powiodło się."}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-muted">
                    <span>
                      <strong className="text-ink">{letter}</strong> · {variant.provider} · {STATUS_LABELS[variant.status] ?? variant.status}
                      {variant.costCents ? ` · ≈${formatPLN(variant.costCents)}` : ""}
                    </span>
                    <span className="flex gap-3">
                      {variant.downloadUrl && (
                        <a className="link" href={variant.downloadUrl}>
                          Pobierz
                        </a>
                      )}
                      <button
                        type="button"
                        className="text-danger hover:underline disabled:opacity-50"
                        disabled={busy !== null || isActive(variant)}
                        onClick={() => void removeVariant(variant)}
                      >
                        Usuń
                      </button>
                    </span>
                  </div>
                  {variant.status === "DONE" && (
                    <div className="mt-2 space-y-1.5">
                      <button
                        type="button"
                        className="btn-primary min-h-9 w-full py-1.5 text-xs"
                        disabled={disabled || busy !== null}
                        onClick={() => void publish(variant, true, letter)}
                      >
                        {busy === `publish-${variant.id}-p` ? "Zapisywanie…" : "Ustaw jako wynik główny"}
                      </button>
                      <div className="flex gap-1.5">
                        <input
                          aria-label={`Etykieta wariantu ${letter} dla klienta`}
                          value={labels[variant.id] ?? `Wariant ${letter}`}
                          onChange={(event) => setLabels((current) => ({ ...current, [variant.id]: event.target.value }))}
                          maxLength={80}
                          className="min-w-0 flex-1 rounded-control border border-line bg-surface px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          className="btn-secondary min-h-8 shrink-0 px-2.5 py-1 text-xs"
                          disabled={disabled || busy !== null}
                          onClick={() => void publish(variant, false, letter)}
                        >
                          {busy === `publish-${variant.id}-v` ? "…" : "Dodaj jako wariant dla klienta"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <h4 className="text-sm font-semibold text-ink">
          Warianty dla klienta <span className="font-normal text-muted">({results.length}) – ze znakiem wodnym, klient dostaje wszystkie</span>
        </h4>
        {results.length > 0 && (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="warianty-klienta">
            {results.map((result) => (
              <li key={result.id} className="flex min-w-0 gap-2.5 rounded-control border border-line p-2">
                <a href={result.url} target="_blank" rel="noreferrer" className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-md bg-cream">
                  <Image src={result.thumbUrl} alt={result.label ?? "Wariant dla klienta"} fill unoptimized sizes="96px" className="object-cover" />
                </a>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted">{result.source === "ai" ? "z AI" : "ręczny"}</p>
                  <div className="flex gap-1">
                    <input
                      aria-label="Etykieta wariantu"
                      value={labelOf(result)}
                      placeholder="Etykieta"
                      maxLength={80}
                      onChange={(event) => setResultLabels((current) => ({ ...current, [result.id]: event.target.value }))}
                      className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      className="rounded-md border border-line px-2 text-xs font-medium text-brand hover:bg-brand-light disabled:opacity-50"
                      disabled={busy !== null || labelOf(result) === (result.label ?? "")}
                      onClick={() => void saveResultLabel(result)}
                    >
                      Zapisz
                    </button>
                  </div>
                  <button type="button" className="text-xs text-danger hover:underline disabled:opacity-50" disabled={busy !== null} onClick={() => void removeResult(result)}>
                    Usuń wariant
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            aria-label="Etykieta nowego wariantu"
            value={extraLabel}
            onChange={(event) => setExtraLabel(event.target.value)}
            placeholder="Etykieta, np. Jaśniejsza sofa"
            maxLength={80}
            className="w-56 rounded-control border border-line bg-surface px-2.5 py-1.5 text-sm"
          />
          <label
            htmlFor={`${ids}-extra`}
            className={`btn-secondary min-h-9 cursor-pointer px-3 py-1.5 text-sm ${busy !== null || disabled ? "pointer-events-none opacity-55" : ""}`}
          >
            {busy === "extra" ? "Wgrywanie…" : "Wgraj dodatkowy wariant"}
          </label>
          <input
            id={`${ids}-extra`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy !== null || disabled}
            data-testid={`wariant-reczny-${photo.id}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadExtra(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {lightbox?.url && (
        <CompareLightbox
          title={`Zdjęcie ${photo.index + 1} – porównanie z oryginałem`}
          originalUrl={photo.originalUrl}
          variantUrl={lightbox.url}
          onClose={closeLightbox}
        />
      )}
    </li>
  );
}
