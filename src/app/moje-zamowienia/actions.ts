"use server";

import { redirect } from "next/navigation";
import { MY_ORDERS_ROUTE, consumeMagicLink, endClientSession, startClientSession } from "@/lib/magic-link";
import { getAppSecret } from "@/lib/secrets";

/** Zużywa jednorazowy link i loguje klienta (ciasteczko `client_session` na 24 h). */
export async function loginWithMagicLink(token: string): Promise<void> {
  // Najpierw sprawdzamy konfigurację podpisu – brak sekretu nie może „spalić” linku klienta.
  getAppSecret();
  const email = await consumeMagicLink(token);
  if (!email) redirect(`${MY_ORDERS_ROUTE}?link=niewazny`);
  await startClientSession(email);
  redirect(MY_ORDERS_ROUTE);
}

export async function logoutClient(): Promise<void> {
  await endClientSession();
  redirect(`${MY_ORDERS_ROUTE}?wylogowano=1`);
}
