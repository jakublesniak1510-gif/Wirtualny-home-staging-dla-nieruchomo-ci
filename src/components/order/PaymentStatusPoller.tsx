"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 5_000;
const MAX_DURATION_MS = 3 * 60_000;

/**
 * Po powrocie ze Stripe odpytuje status płatności co 5 s (maks. 3 min), dopóki
 * zamówienie jest nieopłacone; po zmianie odświeża stronę (dane z serwera).
 */
export function PaymentStatusPoller({ token, active }: { token: string; active: boolean }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    let stopped = false;
    const timer = window.setInterval(async () => {
      if (stopped) return;
      if (Date.now() - started > MAX_DURATION_MS) {
        stopped = true;
        window.clearInterval(timer);
        setTimedOut(true);
        return;
      }
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(token)}/status`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { paymentStatus?: string; status?: string };
        if (body.paymentStatus !== "UNPAID" || body.status === "CANCELLED") {
          stopped = true;
          window.clearInterval(timer);
          router.refresh();
        }
      } catch {
        // chwilowy błąd sieci – spróbujemy przy następnym cyklu
      }
    }, INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [active, token, router]);

  if (!active) return null;
  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-ink/80" aria-live="polite">
      {timedOut ? (
        "Nadal czekamy na potwierdzenie płatności. Odśwież stronę za kilka minut – dostaniesz też e-mail z potwierdzeniem."
      ) : (
        <>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
          Sprawdzamy status płatności…
        </>
      )}
    </p>
  );
}
