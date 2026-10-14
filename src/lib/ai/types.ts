/**
 * Wspólny kontrakt dostawców edycji obrazu (virtual staging przez AI).
 * Każdy dostawca dostaje zdjęcie pustego pokoju + prompt i zwraca jeden obraz wynikowy.
 */

export interface GenerateInput {
  image: Buffer;
  mimeType: string;
  prompt: string;
  /** Wymiary przesyłanego obrazu (po ewentualnym zmniejszeniu). */
  width?: number;
  height?: number;
  /** Ziarno losowości – różne dla kolejnych wariantów, jeśli dostawca je obsługuje. */
  seed?: number;
}

export interface GenerateOutput {
  image: Buffer;
  mimeType: string;
  /** Identyfikator zadania u dostawcy (np. predykcja Replicate). */
  externalId?: string;
  /** Szacowany koszt w groszach (do statystyk w panelu). */
  costCents?: number;
}

export interface ImageEditProvider {
  /** Stały identyfikator zapisywany w AiVariant.provider (np. "replicate"). */
  id: string;
  /** Nazwa dla operatora w panelu. */
  label: string;
  /** Nazwa modelu (z env lub domyślna) – zapisywana w AiVariant.model. */
  readonly model: string;
  /** Czy są klucze/ustawienia potrzebne do wywołania API. */
  isConfigured(): boolean;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

/** Błąd dostawcy AI z komunikatem po polsku (pokazywany operatorowi w panelu). */
export class AiProviderError extends Error {
  readonly provider: string;
  readonly status?: number;
  constructor(provider: string, message: string, status?: number) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.status = status;
  }
}

/** Domyślny limit czasu pojedynczego wywołania API dostawcy. */
export const AI_TIMEOUT_MS = 120_000;

export interface ProviderOptions {
  /** Limit czasu całego generowania (ms) – domyślnie AI_TIMEOUT_MS. */
  timeoutMs?: number;
}
