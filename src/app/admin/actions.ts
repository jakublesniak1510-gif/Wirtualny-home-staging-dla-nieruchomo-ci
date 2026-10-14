"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkAdminPassword,
  endAdminSession,
  isAdminConfigured,
  startAdminSession,
} from "@/lib/admin-auth";
import { getClientIp, rateLimit, LIMITS } from "@/lib/rate-limit";
import { MissingSecretError } from "@/lib/secrets";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`login:${ip}`, LIMITS.login).ok) {
    return { error: "Zbyt wiele prób logowania. Odczekaj kilka minut." };
  }
  if (!isAdminConfigured()) {
    return { error: "Panel nie jest skonfigurowany – ustaw ADMIN_PASSWORD w zmiennych środowiskowych." };
  }
  const password = formData.get("password");
  if (typeof password !== "string" || !checkAdminPassword(password)) {
    return { error: "Nieprawidłowe hasło." };
  }
  try {
    await startAdminSession();
  } catch (error) {
    if (error instanceof MissingSecretError) return { error: error.message };
    throw error;
  }
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
