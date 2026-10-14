"use client";

import { useEffect } from "react";

/** Odnawia sesję admina (przesuwane okno ważności) raz przy wejściu do panelu. */
export function SessionKeepAlive() {
  useEffect(() => {
    void fetch("/api/admin/session", { method: "POST" }).catch(() => undefined);
  }, []);
  return null;
}
