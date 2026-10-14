import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGeminiProvider } from "@/lib/ai/gemini";
import { getDefaultProvider, getProviders, isAnyAiConfigured } from "@/lib/ai/index";
import { createMockProvider } from "@/lib/ai/mock";
import { createOpenAiProvider, pickOpenAiSize } from "@/lib/ai/openai";
import { createReplicateProvider } from "@/lib/ai/replicate";
import { AiProviderError } from "@/lib/ai/types";

const ENV_KEYS = [
  "AI_PROVIDER",
  "AI_MOCK_ENABLED",
  "REPLICATE_API_TOKEN",
  "REPLICATE_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_IMAGE_MODEL",
  "OPENAI_IMAGE_QUALITY",
  "GEMINI_API_KEY",
  "GEMINI_IMAGE_MODEL",
] as const;

let input: Buffer;
let outputJpeg: Buffer;
const saved: Record<string, string | undefined> = {};

beforeEach(async () => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  input = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#cccccc" } }).jpeg().toBuffer();
  outputJpeg = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#336699" } }).jpeg().toBuffer();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type FetchArgs = [string, RequestInit | undefined];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** fetch, który czeka na przerwanie (AbortSignal) – do testów limitu czasu. */
function hangingFetch() {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  });
}

const baseInput = () => ({ image: input, mimeType: "image/jpeg", prompt: "stage it", width: 1600, height: 1000, seed: 7 });

describe("Replicate", () => {
  it("bez tokenu nie jest skonfigurowany i rzuca czytelny błąd", async () => {
    const provider = createReplicateProvider();
    expect(provider.isConfigured()).toBe(false);
    await expect(provider.generate(baseInput())).rejects.toThrow(/REPLICATE_API_TOKEN/);
  });

  it("sukces: Prefer: wait, polling do succeeded, pobranie wyniku", async () => {
    process.env.REPLICATE_API_TOKEN = "r8_test";
    const calls: FetchArgs[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      if (url.endsWith("/predictions") && init?.method === "POST") return jsonResponse({ id: "abc", status: "starting" }, 201);
      if (url.endsWith("/predictions/abc")) {
        const polls = calls.filter(([u]) => u.endsWith("/predictions/abc")).length;
        return jsonResponse(polls < 2 ? { id: "abc", status: "processing" } : { id: "abc", status: "succeeded", output: "https://replicate.delivery/x/out.jpg" });
      }
      if (url === "https://replicate.delivery/x/out.jpg") return new Response(new Uint8Array(outputJpeg), { headers: { "Content-Type": "image/jpeg" } });
      return new Response("nie", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createReplicateProvider({ pollIntervalMs: 1 }).generate(baseInput());
    expect(result.image.equals(outputJpeg)).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.externalId).toBe("abc");
    expect(result.costCents).toBeGreaterThan(0);

    const [url, init] = calls[0];
    expect(url).toBe("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer r8_test");
    expect(headers.Prefer).toBe("wait");
    const body = JSON.parse(String(init?.body)) as { input: Record<string, unknown> };
    expect(body.input.prompt).toBe("stage it");
    expect(body.input.output_format).toBe("jpg");
    expect(String(body.input.input_image)).toMatch(/^data:image\/jpeg;base64,/);
    expect(body.input.seed).toBe(7);
  });

  it("błąd HTTP 401 → komunikat PL o kluczu", async () => {
    process.env.REPLICATE_API_TOKEN = "zly";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "Invalid token." }, 401)));
    const error = await createReplicateProvider().generate(baseInput()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiProviderError);
    expect((error as AiProviderError).message).toMatch(/nieprawidłowy lub nieaktywny klucz API \(HTTP 401\) – Invalid token\./);
  });

  it("predykcja failed → błąd z powodem", async () => {
    process.env.REPLICATE_API_TOKEN = "r8";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: "p1", status: "failed", error: "NSFW" }, 201)));
    await expect(createReplicateProvider().generate(baseInput())).rejects.toThrow(/nie powiodło się \(NSFW\)/);
  });

  it("timeout → komunikat o limicie czasu", async () => {
    process.env.REPLICATE_API_TOKEN = "r8";
    vi.stubGlobal("fetch", hangingFetch());
    await expect(createReplicateProvider({ timeoutMs: 30 }).generate(baseInput())).rejects.toThrow(/przekroczono limit czasu/);
  });
});

describe("OpenAI", () => {
  it("wybiera rozmiar z proporcji", () => {
    expect(pickOpenAiSize(1600, 1000)).toBe("1536x1024");
    expect(pickOpenAiSize(1000, 1600)).toBe("1024x1536");
    expect(pickOpenAiSize(1000, 1050)).toBe("1024x1024");
    expect(pickOpenAiSize()).toBe("auto");
  });

  it("sukces: multipart do /v1/images/edits, wynik z b64_json", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    let captured: FormData | null = null;
    let capturedUrl = "";
    let auth = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        captured = init?.body as FormData;
        auth = (init?.headers as Record<string, string>).Authorization;
        return jsonResponse({ data: [{ b64_json: outputJpeg.toString("base64") }] });
      }),
    );
    const result = await createOpenAiProvider().generate(baseInput());
    expect(capturedUrl).toBe("https://api.openai.com/v1/images/edits");
    expect(auth).toBe("Bearer sk-test");
    const form = captured as unknown as FormData;
    expect(form.get("model")).toBe("gpt-image-1");
    expect(form.get("prompt")).toBe("stage it");
    expect(form.get("size")).toBe("1536x1024");
    expect(form.get("image")).toBeInstanceOf(Blob);
    expect(result.image.equals(outputJpeg)).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("błąd HTTP 400 z komunikatem API", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { message: "Invalid image file" } }, 400)));
    await expect(createOpenAiProvider().generate(baseInput())).rejects.toThrow(/OpenAI: API odrzuciło zapytanie \(HTTP 400\) – Invalid image file/);
  });

  it("odpowiedź bez obrazu → błąd", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: [] })));
    await expect(createOpenAiProvider().generate(baseInput())).rejects.toThrow(/bez obrazu/);
  });

  it("timeout", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", hangingFetch());
    await expect(createOpenAiProvider({ timeoutMs: 30 }).generate(baseInput())).rejects.toThrow(/OpenAI: przekroczono limit czasu/);
  });
});

describe("Gemini", () => {
  it("sukces: generateContent z inlineData, obraz z parts[].inlineData", async () => {
    process.env.GEMINI_API_KEY = "g-key";
    let url = "";
    let init: RequestInit | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string, i?: RequestInit) => {
        url = u;
        init = i;
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "Here you go" }, { inlineData: { mimeType: "image/png", data: outputJpeg.toString("base64") } }] } }],
          responseId: "resp-1",
        });
      }),
    );
    const result = await createGeminiProvider().generate(baseInput());
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent");
    expect((init?.headers as Record<string, string>)["x-goog-api-key"]).toBe("g-key");
    const body = JSON.parse(String(init?.body)) as { contents: Array<{ parts: Array<Record<string, unknown>> }> };
    expect(body.contents[0].parts[0]).toHaveProperty("inlineData");
    expect(body.contents[0].parts[1]).toEqual({ text: "stage it" });
    expect(result.image.equals(outputJpeg)).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.externalId).toBe("resp-1");
  });

  it("brak obrazu w odpowiedzi (blokada) → czytelny błąd", async () => {
    process.env.GEMINI_API_KEY = "g-key";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ promptFeedback: { blockReason: "SAFETY" } })));
    await expect(createGeminiProvider().generate(baseInput())).rejects.toThrow(/nie zwrócił obrazu \(SAFETY\)/);
  });

  it("błąd HTTP 429", async () => {
    process.env.GEMINI_API_KEY = "g-key";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { message: "Quota exceeded" } }, 429)));
    await expect(createGeminiProvider().generate(baseInput())).rejects.toThrow(/limit zapytań.*HTTP 429.*Quota exceeded/);
  });

  it("timeout", async () => {
    process.env.GEMINI_API_KEY = "g-key";
    vi.stubGlobal("fetch", hangingFetch());
    await expect(createGeminiProvider({ timeoutMs: 30 }).generate(baseInput())).rejects.toThrow(/Gemini: przekroczono limit czasu/);
  });
});

describe("rejestr dostawców", () => {
  it("bez kluczy: nic nie jest skonfigurowane, brak domyślnego, brak mocka", () => {
    expect(isAnyAiConfigured()).toBe(false);
    expect(getDefaultProvider()).toBeNull();
    expect(getProviders().map((p) => p.id)).toEqual(["replicate", "openai", "gemini"]);
  });

  it("AI_PROVIDER wybiera skonfigurowanego dostawcę, inaczej pierwszy skonfigurowany", () => {
    process.env.OPENAI_API_KEY = "sk";
    process.env.GEMINI_API_KEY = "g";
    process.env.AI_PROVIDER = "gemini";
    expect(getDefaultProvider()?.id).toBe("gemini");
    process.env.AI_PROVIDER = "replicate";
    expect(getDefaultProvider()?.id).toBe("openai");
  });

  it("mock tylko z AI_PROVIDER=mock (poza produkcją) i zwraca zmieniony obraz", async () => {
    process.env.AI_PROVIDER = "mock";
    expect(getDefaultProvider()?.id).toBe("mock");
    const result = await createMockProvider({ delayMs: 1 }).generate(baseInput());
    const meta = await sharp(result.image).metadata();
    expect(meta.width).toBe(64);
    expect(result.image.equals(input)).toBe(false);
  });
});
