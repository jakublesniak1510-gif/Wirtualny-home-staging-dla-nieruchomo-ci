"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import type { LoginState } from "@/app/admin/actions";
import { inputClass } from "@/components/order/FormField";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="card mt-6 space-y-4 p-6">
      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium text-ink">
          Hasło
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "admin-login-error" : undefined}
          className={`${inputClass} mt-1.5`}
        />
      </div>
      {state.error && (
        <p id="admin-login-error" className="text-sm font-medium text-danger" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Logowanie…" : "Zaloguj się"}
      </button>
    </form>
  );
}
