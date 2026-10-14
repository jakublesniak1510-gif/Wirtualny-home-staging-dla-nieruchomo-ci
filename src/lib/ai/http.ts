import { AiProviderError } from "@/lib/ai/types";

/** Wspólne helpery HTTP dla dostawców AI (timeout, czytelne błędy PL). */

/**
 * fetch z limitem czasu. Przekroczenie → AiProviderError z komunikatem PL,
 * błąd sieci → AiProviderError „brak połączenia”.
 */
export async function fetchWithTimeout(
  providerLabel: string,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AiProviderError(
        providerLabel,
        `${providerLabel}: przekroczono limit czasu (${Math.round(timeoutMs / 1000)} s). Spróbuj ponownie lub wybierz innego dostawcę.`,
      );
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new AiProviderError(providerLabel, `${providerLabel}: brak połączenia z API (${detail}).`);
  } finally {
    clearTimeout(timer);
  }
}

/** Wyciąga komunikat błędu z odpowiedzi JSON/tekstowej dostawcy (skrócony). */
export async function readErrorDetail(response: Response): Promise<string> {
  let text = "";
  try {
    text = await response.text();
  } catch {
    return "";
  }
  try {
    const data: unknown = JSON.parse(text);
    const found = findMessage(data);
    if (found) return found.slice(0, 300);
  } catch {
    // nie-JSON – zwracamy tekst
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 300);
}

function findMessage(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  for (const key of ["detail", "message", "error", "title"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object") {
      const nested = findMessage(value);
      if (nested) return nested;
    }
  }
  return null;
}

/** Komunikat PL dla typowych kodów HTTP. */
export function httpErrorMessage(providerLabel: string, status: number, detail: string): string {
  const reason =
    status === 401 || status === 403
      ? "nieprawidłowy lub nieaktywny klucz API"
      : status === 402
        ? "brak środków na koncie dostawcy"
        : status === 404
          ? "nie znaleziono modelu – sprawdź nazwę modelu w .env"
          : status === 413
            ? "zdjęcie jest za duże dla API"
            : status === 422 || status === 400
              ? "API odrzuciło zapytanie"
              : status === 429
                ? "przekroczono limit zapytań – odczekaj chwilę"
                : status >= 500
                  ? "błąd po stronie dostawcy"
                  : "nieoczekiwana odpowiedź";
  return `${providerLabel}: ${reason} (HTTP ${status})${detail ? ` – ${detail}` : ""}.`;
}

/** Rzuca AiProviderError, gdy odpowiedź nie jest 2xx. */
export async function ensureOk(providerLabel: string, response: Response): Promise<void> {
  if (response.ok) return;
  const detail = await readErrorDetail(response);
  throw new AiProviderError(providerLabel, httpErrorMessage(providerLabel, response.status, detail), response.status);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Typ MIME z nagłówka lub sygnatury bajtów (JPEG/PNG/WebP). */
export function sniffImageMime(buffer: Buffer, fallback = "image/png"): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return fallback;
}
