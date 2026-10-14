"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RewardResponse {
  error?: string;
  packageCode?: string;
  emailSent?: boolean;
  emailError?: string;
}

/** „Wydaj nagrodę” – kod pakietu dla polecającego + e-mail. */
export function ReferralRewardButton({ referralCode, photos, disabled }: { referralCode: string; photos: number; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function issue() {
    if (!window.confirm(`Wydać kod na ${photos} zdjęć dla ${referralCode}?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      });
      const body = (await response.json()) as RewardResponse;
      if (!response.ok || !body.packageCode) {
        setMessage({ ok: false, text: body.error ?? "Nie udało się wydać nagrody." });
      } else {
        setMessage({
          ok: true,
          text: `Kod ${body.packageCode}${body.emailSent ? " – wysłano e-mail." : ` – e-mail nie wyszedł: ${body.emailError ?? "błąd"}`}`,
        });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Błąd połączenia." });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-1">
      <button type="button" className="btn-primary min-h-9 py-1.5 text-sm" disabled={disabled || busy} onClick={() => void issue()}>
        {busy ? "Wydawanie…" : "Wydaj nagrodę"}
      </button>
      {message && (
        <p className={`text-xs ${message.ok ? "text-success" : "text-danger"}`} role={message.ok ? "status" : "alert"} data-testid="nagroda-wynik">
          {message.text}
        </p>
      )}
    </div>
  );
}
