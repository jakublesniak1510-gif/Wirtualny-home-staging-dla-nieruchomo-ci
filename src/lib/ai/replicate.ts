import { ensureOk, fetchWithTimeout, sleep, sniffImageMime } from "@/lib/ai/http";
import { AI_TIMEOUT_MS, AiProviderError } from "@/lib/ai/types";
import type { GenerateInput, GenerateOutput, ImageEditProvider, ProviderOptions } from "@/lib/ai/types";

/**
 * Replicate – domyślnie model black-forest-labs/flux-kontext-pro (edycja obrazu poleceniem tekstowym).
 *
 * API zweryfikować z aktualną dokumentacją dostawcy:
 * https://replicate.com/docs/reference/http#models.predictions.create
 * https://replicate.com/black-forest-labs/flux-kontext-pro/api
 *
 * Przepływ: POST /v1/models/{model}/predictions z `Prefer: wait` (API czeka do ~60 s),
 * a jeśli predykcja nie skończyła się – polling GET /v1/predictions/{id} do `succeeded`.
 * Zdjęcie przekazujemy jako data URL (Replicate zaleca to dla plików < 1 MB – dlatego
 * image-prep.ts zmniejsza wejście poniżej tego progu).
 */

export const REPLICATE_DEFAULT_MODEL = "black-forest-labs/flux-kontext-pro";
const API = "https://api.replicate.com/v1";
const LABEL = "Replicate";
/** Szacunek: ok. 0,04 USD za obraz (FLUX Kontext Pro) ≈ 16 gr. Sprawdź aktualny cennik. */
export const REPLICATE_ESTIMATED_COST_GROSZE = 16;

interface Prediction {
  id?: string;
  status?: string;
  output?: unknown;
  error?: unknown;
  urls?: { get?: string };
}

function getToken(): string | undefined {
  return process.env.REPLICATE_API_TOKEN?.trim() || undefined;
}

function getModel(): string {
  return process.env.REPLICATE_MODEL?.trim() || REPLICATE_DEFAULT_MODEL;
}

function firstOutputUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const found = output.find((item): item is string => typeof item === "string");
    return found ?? null;
  }
  return null;
}

export function createReplicateProvider(options: ProviderOptions & { pollIntervalMs?: number } = {}): ImageEditProvider {
  const timeoutMs = options.timeoutMs ?? AI_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? 2000;

  return {
    id: "replicate",
    label: "Replicate (FLUX Kontext)",
    get model() {
      return getModel();
    },
    isConfigured: () => Boolean(getToken()),

    async generate(input: GenerateInput): Promise<GenerateOutput> {
      const token = getToken();
      if (!token) throw new AiProviderError(LABEL, "Replicate: brak REPLICATE_API_TOKEN w .env.");
      const model = getModel();
      if (!/^[\w.-]+\/[\w.-]+$/.test(model)) {
        throw new AiProviderError(LABEL, `Replicate: nieprawidłowa nazwa modelu „${model}” (oczekiwano właściciel/model).`);
      }
      const deadline = Date.now() + timeoutMs;
      const remaining = () => Math.max(1, deadline - Date.now());
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const body = {
        input: {
          prompt: input.prompt,
          input_image: `data:${input.mimeType};base64,${input.image.toString("base64")}`,
          output_format: "jpg",
          ...(input.seed !== undefined ? { seed: input.seed } : {}),
        },
      };
      const created = await fetchWithTimeout(
        LABEL,
        `${API}/models/${model}/predictions`,
        { method: "POST", headers: { ...headers, Prefer: "wait" }, body: JSON.stringify(body) },
        remaining(),
      );
      await ensureOk(LABEL, created);
      let prediction = (await created.json()) as Prediction;
      const predictionId = prediction.id;
      if (!predictionId) throw new AiProviderError(LABEL, "Replicate: odpowiedź bez identyfikatora predykcji.");

      while (prediction.status === "starting" || prediction.status === "processing") {
        if (Date.now() + pollIntervalMs >= deadline) {
          throw new AiProviderError(
            LABEL,
            `Replicate: przekroczono limit czasu (${Math.round(timeoutMs / 1000)} s) – predykcja ${predictionId} nadal trwa.`,
          );
        }
        await sleep(pollIntervalMs);
        const polled = await fetchWithTimeout(
          LABEL,
          `${API}/predictions/${encodeURIComponent(predictionId)}`,
          { headers },
          remaining(),
        );
        await ensureOk(LABEL, polled);
        prediction = (await polled.json()) as Prediction;
      }

      if (prediction.status !== "succeeded") {
        const reason = typeof prediction.error === "string" ? prediction.error : prediction.status ?? "nieznany status";
        throw new AiProviderError(LABEL, `Replicate: generowanie nie powiodło się (${reason}).`);
      }
      const url = firstOutputUrl(prediction.output);
      if (!url) throw new AiProviderError(LABEL, "Replicate: predykcja zakończona, ale bez obrazu wynikowego.");

      const file = await fetchWithTimeout(LABEL, url, {}, remaining());
      await ensureOk(LABEL, file);
      const image = Buffer.from(await file.arrayBuffer());
      return {
        image,
        mimeType: sniffImageMime(image, file.headers.get("content-type") ?? "image/jpeg"),
        externalId: predictionId,
        costCents: REPLICATE_ESTIMATED_COST_GROSZE,
      };
    },
  };
}
