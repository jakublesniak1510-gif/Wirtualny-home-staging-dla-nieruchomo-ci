import { ensureOk, fetchWithTimeout, sniffImageMime } from "@/lib/ai/http";
import { AI_TIMEOUT_MS, AiProviderError } from "@/lib/ai/types";
import type { GenerateInput, GenerateOutput, ImageEditProvider, ProviderOptions } from "@/lib/ai/types";

/**
 * Google Gemini – edycja obrazu modelem z rodziny „Nano Banana” (domyślnie gemini-2.5-flash-image)
 * przez POST /v1beta/models/{model}:generateContent (zdjęcie jako inlineData + tekst).
 *
 * API zweryfikować z aktualną dokumentacją dostawcy:
 * https://ai.google.dev/gemini-api/docs/image-generation
 * https://ai.google.dev/api/generate-content
 * (Google oznacza gemini-2.5-flash-image jako starszą generację – nowszy model ustawisz w GEMINI_IMAGE_MODEL.)
 *
 * Obraz wynikowy: candidates[0].content.parts[].inlineData { mimeType, data (base64) }.
 */

export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash-image";
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const LABEL = "Gemini";
/** Szacunek: ok. 0,039 USD za obraz ≈ 16 gr. Sprawdź aktualny cennik. */
export const GEMINI_ESTIMATED_COST_GROSZE = 16;

interface InlineData {
  mimeType?: string;
  mime_type?: string;
  data?: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: InlineData;
  inline_data?: InlineData;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
  responseId?: string;
}

function getKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

function getModel(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
}

export function createGeminiProvider(options: ProviderOptions = {}): ImageEditProvider {
  const timeoutMs = options.timeoutMs ?? AI_TIMEOUT_MS;

  return {
    id: "gemini",
    label: "Google Gemini (Nano Banana)",
    get model() {
      return getModel();
    },
    isConfigured: () => Boolean(getKey()),

    async generate(input: GenerateInput): Promise<GenerateOutput> {
      const key = getKey();
      if (!key) throw new AiProviderError(LABEL, "Gemini: brak GEMINI_API_KEY w .env.");
      const model = getModel();
      if (!/^[\w.-]+$/.test(model)) {
        throw new AiProviderError(LABEL, `Gemini: nieprawidłowa nazwa modelu „${model}”.`);
      }
      const body = {
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: input.mimeType, data: input.image.toString("base64") } },
              { text: input.prompt },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      };
      const response = await fetchWithTimeout(
        LABEL,
        `${API}/${model}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        timeoutMs,
      );
      await ensureOk(LABEL, response);
      const data = (await response.json()) as GeminiResponse;
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.map((part) => part.inlineData ?? part.inline_data).find((inline) => inline?.data);
      if (!imagePart?.data) {
        const reason =
          data.promptFeedback?.blockReason ??
          data.candidates?.[0]?.finishReason ??
          parts.find((part) => part.text)?.text?.slice(0, 200) ??
          "brak obrazu w odpowiedzi";
        throw new AiProviderError(LABEL, `Gemini: model nie zwrócił obrazu (${reason}).`);
      }
      const image = Buffer.from(imagePart.data, "base64");
      return {
        image,
        mimeType: sniffImageMime(image, imagePart.mimeType ?? imagePart.mime_type ?? "image/png"),
        externalId: data.responseId,
        costCents: GEMINI_ESTIMATED_COST_GROSZE,
      };
    },
  };
}
