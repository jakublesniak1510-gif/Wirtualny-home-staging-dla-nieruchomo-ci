import sharp from "sharp";
import { sleep } from "@/lib/ai/http";
import type { GenerateInput, GenerateOutput, ImageEditProvider } from "@/lib/ai/types";

/**
 * Dostawca testowy (E2E, praca lokalna bez kluczy): zwraca oryginał z nałożonym kolorowym
 * prostokątem po ~1 s. Aktywny TYLKO gdy AI_PROVIDER=mock i NODE_ENV !== "production"
 * – albo gdy jawnie włączono AI_MOCK_ENABLED=1 (testy E2E na `next start`, który zawsze
 * działa w trybie production). Nigdy nie włączaj AI_MOCK_ENABLED na prawdziwym serwerze.
 */

const COLORS = ["#c0673f", "#1f4d3a", "#2d3e5c", "#d9a441", "#8b4a2b", "#7c8a6e"];

export function isMockAllowed(): boolean {
  if (process.env.AI_PROVIDER?.trim().toLowerCase() !== "mock") return false;
  return process.env.NODE_ENV !== "production" || process.env.AI_MOCK_ENABLED === "1";
}

export function createMockProvider(options: { delayMs?: number } = {}): ImageEditProvider {
  const delayMs = options.delayMs ?? 1000;
  return {
    id: "mock",
    label: "Testowy (bez API)",
    model: "mock-rectangle",
    isConfigured: isMockAllowed,
    async generate(input: GenerateInput): Promise<GenerateOutput> {
      await sleep(delayMs);
      const meta = await sharp(input.image).metadata();
      const width = meta.width ?? 800;
      const height = meta.height ?? 600;
      const color = COLORS[Math.abs(input.seed ?? 0) % COLORS.length];
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
          `<rect x="${Math.round(width * 0.25)}" y="${Math.round(height * 0.55)}" width="${Math.round(width * 0.5)}" height="${Math.round(height * 0.25)}" rx="${Math.round(width * 0.02)}" fill="${color}"/>` +
          `</svg>`,
      );
      const image = await sharp(input.image).composite([{ input: svg, top: 0, left: 0 }]).jpeg({ quality: 88 }).toBuffer();
      return { image, mimeType: "image/jpeg", externalId: `mock-${Date.now()}`, costCents: 0 };
    },
  };
}
