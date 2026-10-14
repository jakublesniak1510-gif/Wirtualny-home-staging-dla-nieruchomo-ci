import { ensureOk, fetchWithTimeout, sniffImageMime } from "@/lib/ai/http";
import { AI_TIMEOUT_MS, AiProviderError } from "@/lib/ai/types";
import type { GenerateInput, GenerateOutput, ImageEditProvider, ProviderOptions } from "@/lib/ai/types";

/**
 * OpenAI Images – edycja zdjęcia modelem gpt-image-1 (POST /v1/images/edits, multipart).
 *
 * API zweryfikować z aktualną dokumentacją dostawcy:
 * https://platform.openai.com/docs/api-reference/images/createEdit
 * https://platform.openai.com/docs/guides/image-generation
 *
 * gpt-image-1 zwraca obraz w `data[0].b64_json`. Rozmiar wyliczamy z proporcji zdjęcia
 * (1536×1024 / 1024×1536 / 1024×1024); wynik image-prep.ts przeskalowuje z powrotem do proporcji oryginału.
 */

export const OPENAI_DEFAULT_MODEL = "gpt-image-1";
const API = "https://api.openai.com/v1/images/edits";
const LABEL = "OpenAI";

/**
 * Szacunek kosztu w groszach wg jakości (1536×1024, ~4 zł/USD): low ≈ 0,02 USD,
 * medium ≈ 0,06 USD, high ≈ 0,25 USD + tokeny obrazu wejściowego. Sprawdź aktualny cennik.
 */
const COST_BY_QUALITY: Record<string, number> = { low: 8, medium: 27, high: 100, auto: 100 };

interface OpenAiImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
}

function getKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

function getModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || OPENAI_DEFAULT_MODEL;
}

function getQuality(): string | undefined {
  const value = process.env.OPENAI_IMAGE_QUALITY?.trim().toLowerCase();
  return value && ["low", "medium", "high", "auto"].includes(value) ? value : undefined;
}

/** Najbliższy obsługiwany rozmiar gpt-image-1 dla proporcji zdjęcia. */
export function pickOpenAiSize(width?: number, height?: number): string {
  if (!width || !height) return "auto";
  const ratio = width / height;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.87) return "1024x1536";
  return "1024x1024";
}

export function createOpenAiProvider(options: ProviderOptions = {}): ImageEditProvider {
  const timeoutMs = options.timeoutMs ?? AI_TIMEOUT_MS;

  return {
    id: "openai",
    label: "OpenAI (gpt-image-1)",
    get model() {
      return getModel();
    },
    isConfigured: () => Boolean(getKey()),

    async generate(input: GenerateInput): Promise<GenerateOutput> {
      const key = getKey();
      if (!key) throw new AiProviderError(LABEL, "OpenAI: brak OPENAI_API_KEY w .env.");
      const deadline = Date.now() + timeoutMs;
      const quality = getQuality();

      const form = new FormData();
      form.append("model", getModel());
      const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      form.append("image", new Blob([new Uint8Array(input.image)], { type: input.mimeType }), `zdjecie.${ext}`);
      form.append("prompt", input.prompt);
      form.append("size", pickOpenAiSize(input.width, input.height));
      form.append("n", "1");
      if (quality) form.append("quality", quality);

      const response = await fetchWithTimeout(
        LABEL,
        API,
        { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form },
        timeoutMs,
      );
      await ensureOk(LABEL, response);
      const body = (await response.json()) as OpenAiImageResponse;
      const first = body.data?.[0];
      let image: Buffer | null = null;
      if (first?.b64_json) {
        image = Buffer.from(first.b64_json, "base64");
      } else if (first?.url) {
        const file = await fetchWithTimeout(LABEL, first.url, {}, Math.max(1, deadline - Date.now()));
        await ensureOk(LABEL, file);
        image = Buffer.from(await file.arrayBuffer());
      }
      if (!image || image.length === 0) {
        throw new AiProviderError(LABEL, "OpenAI: odpowiedź bez obrazu (brak data[0].b64_json).");
      }
      return {
        image,
        mimeType: sniffImageMime(image),
        costCents: COST_BY_QUALITY[quality ?? "auto"],
      };
    },
  };
}
