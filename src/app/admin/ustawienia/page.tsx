import type { Metadata } from "next";
import type { ReactNode } from "react";
import packageJson from "../../../../package.json";
import { requireAdmin } from "@/lib/admin-auth";
import { getMaxInputSide, getVariantsPerPhoto, isAiSync } from "@/lib/ai/config";
import { getDefaultProvider, getProviderSummaries } from "@/lib/ai/index";
import { getSiteUrl } from "@/lib/site";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ustawienia" };

function Status({ ok, yes = "skonfigurowane", no = "brak" }: { ok: boolean; yes?: string; no?: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? "bg-success/15 text-success" : "bg-danger/10 text-danger"}`}>
      {ok ? yes : no}
    </span>
  );
}

function Item({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2.5">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div className="text-sm">{children}</div>
    </li>
  );
}

/** Tylko odczyt – stan konfiguracji bez pokazywania kluczy. */
export default async function AdminSettingsPage() {
  await requireAdmin();
  const providers = getProviderSummaries();
  const defaultProvider = getDefaultProvider();
  const env = process.env;
  const storageDriver = (env.STORAGE_DRIVER ?? "local").trim().toLowerCase() || "local";
  const s3Ok = storageDriver === "s3" && Boolean(env.S3_BUCKET?.trim() && env.S3_ACCESS_KEY_ID?.trim() && env.S3_SECRET_ACCESS_KEY?.trim());
  const secretOk = (env.ADMIN_SESSION_SECRET?.trim().length ?? 0) >= 32;

  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-semibold text-ink">Ustawienia</h1>
      <p className="mt-1 text-sm text-muted">
        Podgląd konfiguracji (tylko odczyt). Wartości zmieniasz w zmiennych środowiskowych (<code>.env</code> lub panel hostingu) – klucze nie są tu wyświetlane.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink">Generowanie AI</h2>
          <ul className="mt-2 divide-y divide-line">
            {providers.map((provider) => (
              <Item key={provider.id} label={provider.label} hint={`model: ${provider.model}`}>
                <Status ok={provider.configured} no="brak klucza" />
              </Item>
            ))}
            <Item label="Domyślny dostawca" hint="AI_PROVIDER">
              {defaultProvider ? defaultProvider.label : <Status ok={false} no="żaden – skonfiguruj klucz API w .env" />}
            </Item>
            <Item label="Wariantów na zdjęcie" hint="AI_VARIANTS_PER_PHOTO">
              {getVariantsPerPhoto()}
            </Item>
            <Item label="Maks. bok zdjęcia wysyłanego do AI" hint="AI_MAX_INPUT_SIDE">
              {getMaxInputSide()} px
            </Item>
            <Item label="Tryb generowania" hint="AI_SYNC">
              {isAiSync() ? "synchroniczny (żądanie czeka)" : "w tle (kolejka, maks. 2 naraz)"}
            </Item>
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink">Usługi</h2>
          <ul className="mt-2 divide-y divide-line">
            <Item label="Płatności Stripe" hint="STRIPE_SECRET_KEY">
              <Status ok={isStripeConfigured()} />
            </Item>
            <Item label="Webhook Stripe" hint="STRIPE_WEBHOOK_SECRET">
              <Status ok={Boolean(env.STRIPE_WEBHOOK_SECRET?.trim())} />
            </Item>
            <Item label="E-mail Resend" hint="RESEND_API_KEY (bez klucza maile trafiają do logów)">
              <Status ok={Boolean(env.RESEND_API_KEY?.trim())} />
            </Item>
            <Item label="Magazyn plików" hint={`STORAGE_DRIVER=${storageDriver}`}>
              {storageDriver === "s3" ? <Status ok={s3Ok} yes="S3 skonfigurowany" no="S3 niekompletny" /> : <span>lokalny dysk</span>}
            </Item>
            <Item label="Sekret sesji admina" hint="ADMIN_SESSION_SECRET (min. 32 znaki)">
              <Status ok={secretOk} />
            </Item>
            <Item label="Sprzątanie plików (cron)" hint="CRON_SECRET">
              <Status ok={Boolean(env.CRON_SECRET?.trim())} />
            </Item>
            <Item label="Adres serwisu" hint="NEXT_PUBLIC_SITE_URL">
              <span className="font-mono text-xs">{getSiteUrl()}</span>
            </Item>
            <Item label="Wersja aplikacji" hint="package.json">
              <span className="font-mono text-xs" data-testid="wersja">
                {packageJson.version}
              </span>
            </Item>
          </ul>
        </section>
      </div>
    </div>
  );
}
