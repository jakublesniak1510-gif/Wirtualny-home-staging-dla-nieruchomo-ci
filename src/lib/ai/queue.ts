import { AI_CONCURRENCY } from "@/lib/ai/config";

/**
 * Prosta kolejka w pamięci procesu: najwyżej AI_CONCURRENCY zadań naraz (żeby nie przekroczyć
 * limitów API i nie zapchać serwera). Stan w globalThis – przetrwa przeładowanie modułów w dev.
 *
 * UWAGA (serverless): kolejka żyje tylko tak długo jak proces. Trasa uruchamia ją przez `after()`
 * (Vercel utrzymuje funkcję do końca zadania, w granicach maxDuration). Jeśli proces zginie,
 * warianty zostaną w PENDING/RUNNING – recoverStaleVariants() oznaczy je jako FAILED.
 * Alternatywa: AI_SYNC=1 (żądanie czeka na wynik).
 */

type Task = () => Promise<void>;

interface QueueState {
  running: number;
  pending: Array<{ task: Task; resolve: () => void }>;
}

const globalForQueue = globalThis as unknown as { __wsAiQueue?: QueueState };

function state(): QueueState {
  if (!globalForQueue.__wsAiQueue) globalForQueue.__wsAiQueue = { running: 0, pending: [] };
  return globalForQueue.__wsAiQueue;
}

function pump(concurrency: number): void {
  const queue = state();
  while (queue.running < concurrency && queue.pending.length > 0) {
    const next = queue.pending.shift();
    if (!next) break;
    queue.running += 1;
    void next
      .task()
      .catch((error: unknown) => console.error("[ai-queue] Zadanie zakończone błędem:", error))
      .finally(() => {
        queue.running -= 1;
        next.resolve();
        pump(concurrency);
      });
  }
}

/** Dodaje zadanie; obietnica rozwiązuje się po jego zakończeniu (także błędem – zadanie samo loguje). */
export function enqueue(task: Task, concurrency = AI_CONCURRENCY): Promise<void> {
  return new Promise<void>((resolve) => {
    state().pending.push({ task, resolve });
    pump(concurrency);
  });
}

export function getQueueStats(): { running: number; pending: number } {
  const queue = state();
  return { running: queue.running, pending: queue.pending.length };
}
