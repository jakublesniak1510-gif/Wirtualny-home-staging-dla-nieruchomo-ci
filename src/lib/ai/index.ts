import { createGeminiProvider } from "@/lib/ai/gemini";
import { createMockProvider, isMockAllowed } from "@/lib/ai/mock";
import { createOpenAiProvider } from "@/lib/ai/openai";
import { createReplicateProvider } from "@/lib/ai/replicate";
import type { ImageEditProvider } from "@/lib/ai/types";

/** Rejestr dostawców AI. Wybór domyślnego: AI_PROVIDER=replicate|openai|gemini (lub mock w testach). */

const REAL_PROVIDERS: readonly ImageEditProvider[] = [
  createReplicateProvider(),
  createOpenAiProvider(),
  createGeminiProvider(),
];
const MOCK_PROVIDER = createMockProvider();

/** Wszyscy dostawcy widoczni w panelu (mock tylko, gdy dozwolony). */
export function getProviders(): ImageEditProvider[] {
  return isMockAllowed() ? [...REAL_PROVIDERS, MOCK_PROVIDER] : [...REAL_PROVIDERS];
}

export function getProvider(id: string): ImageEditProvider | null {
  return getProviders().find((provider) => provider.id === id) ?? null;
}

/** Dostawca z AI_PROVIDER (jeśli skonfigurowany), inaczej pierwszy skonfigurowany, inaczej null. */
export function getDefaultProvider(): ImageEditProvider | null {
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();
  const providers = getProviders();
  const chosen = preferred ? providers.find((provider) => provider.id === preferred) : undefined;
  if (chosen?.isConfigured()) return chosen;
  return providers.find((provider) => provider.isConfigured()) ?? null;
}

export function isAnyAiConfigured(): boolean {
  return getProviders().some((provider) => provider.isConfigured());
}

/** Dane do UI (bez kluczy). */
export interface ProviderSummary {
  id: string;
  label: string;
  model: string;
  configured: boolean;
}

export function getProviderSummaries(): ProviderSummary[] {
  return getProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    model: provider.model,
    configured: provider.isConfigured(),
  }));
}

export type { ImageEditProvider } from "@/lib/ai/types";
