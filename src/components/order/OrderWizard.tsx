"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ConsentFields, EMPTY_CONSENTS } from "@/components/order/ConsentFields";
import type { ConsentState } from "@/components/order/ConsentFields";
import { FormField, inputClass } from "@/components/order/FormField";
import { PhotoDropzone } from "@/components/order/PhotoDropzone";
import { PriceSummary } from "@/components/order/PriceSummary";
import { StylePicker } from "@/components/order/StylePicker";
import { usePhotoUploads } from "@/components/order/usePhotoUploads";
import type { ConsentKey } from "@/lib/consents";
import { formatPLN, formatPhotoCount } from "@/lib/format";
import { ADDONS, EXPRESS_RATE, MAX_PHOTOS, calculateOrderPrice } from "@/lib/pricing";
import type { AddonSlug } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { getStyle } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";

interface OrderWizardProps {
  initialStyle: StyleSlug;
  /** Dodatki wstępnie zaznaczone (np. z kalkulatora na /cennik: ?dodatki=a,b) */
  initialAddons?: readonly AddonSlug[];
  /** Ekspres wstępnie włączony (?ekspres=1) */
  initialExpress?: boolean;
  /** Kod polecenia z linku polecającego (?polecenie=email) */
  initialReferralCode?: string;
  /** Planowana liczba zdjęć z kalkulatora na /cennik (?zdjecia=N) – tylko do podglądu ceny przed uploadem */
  plannedPhotoCount?: number;
  /** Kod pakietu wstępnie wpisany (?kod=WS-XXXX-XXXX z „Moje zamówienia”) – do sprawdzenia przyciskiem */
  initialPackageCode?: string;
  maxMb: number;
  minShortSide: number;
  paymentsEnabled: boolean;
}

type CodeState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; code: string; credits: number }
  | { state: "invalid"; message: string };

interface ApiError {
  error?: string;
  fields?: Record<string, string>;
}

function StepHeading({ n, title, description }: { n: number; title: string; description?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white" aria-hidden="true">
        {n}
      </span>
      <div>
        <h2 className="text-xl font-semibold text-ink">
          <span className="sr-only">Krok {n}: </span>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </div>
  );
}

export function OrderWizard({
  initialStyle,
  initialAddons = [],
  initialExpress = false,
  initialReferralCode = "",
  initialPackageCode = "",
  plannedPhotoCount,
  maxMb,
  minShortSide,
  paymentsEnabled,
}: OrderWizardProps) {
  const router = useRouter();
  const uploads = usePhotoUploads({ maxFiles: MAX_PHOTOS, maxMb });
  const [style, setStyle] = useState<StyleSlug>(initialStyle);
  const [addons, setAddons] = useState<AddonSlug[]>([...initialAddons]);
  const [express, setExpress] = useState(initialExpress);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [nip, setNip] = useState("");
  const [codeInput, setCodeInput] = useState(initialPackageCode);
  const [code, setCode] = useState<CodeState>({ state: "idle" });
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [consents, setConsents] = useState<ConsentState>(EMPTY_CONSENTS);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const photoCount = uploads.items.length;
  const credits = code.state === "valid" ? code.credits : 0;
  const previewCount = photoCount > 0 ? photoCount : (plannedPhotoCount ?? 1);
  const breakdown = useMemo(
    () =>
      calculateOrderPrice({
        photoCount: Math.min(Math.max(previewCount, 1), MAX_PHOTOS),
        addons,
        express,
        packageCredits: credits,
      }),
    [previewCount, addons, express, credits],
  );
  const turnaround = express ? SITE.expressHours : SITE.turnaroundHours;
  const isFree = photoCount > 0 && breakdown.total === 0;

  const toggleAddon = (slug: AddonSlug, checked: boolean) =>
    setAddons((current) => (checked ? [...current, slug] : current.filter((a) => a !== slug)));

  async function checkCode() {
    const value = codeInput.trim();
    if (!value) {
      setCode({ state: "idle" });
      return;
    }
    setCode({ state: "checking" });
    try {
      const response = await fetch("/api/package-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const body = (await response.json()) as ApiError & { code?: string; creditsLeft?: number };
      if (response.ok && body.code && typeof body.creditsLeft === "number") {
        setCode({ state: "valid", code: body.code, credits: body.creditsLeft });
        setCodeInput(body.code);
      } else {
        setCode({ state: "invalid", message: body.error ?? "Nieprawidłowy kod." });
      }
    } catch {
      setCode({ state: "invalid", message: "Nie udało się sprawdzić kodu – spróbuj ponownie." });
    }
  }

  function clientValidate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (uploads.items.length === 0) errors.photos = "Dodaj co najmniej jedno zdjęcie.";
    else if (uploads.pending) errors.photos = "Poczekaj, aż wszystkie zdjęcia się wgrają.";
    else if (uploads.failed > 0) errors.photos = "Usuń lub wgraj ponownie zdjęcia z błędem.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Podaj poprawny adres e-mail.";
    if (codeInput.trim() && code.state !== "valid") errors.packageCode = "Sprawdź kod pakietu przyciskiem „Sprawdź” albo usuń go.";
    const messages: Record<ConsentKey, string> = {
      terms: "Zaakceptuj Regulamin i Politykę prywatności.",
      digital: "Potwierdź zgodę na rozpoczęcie świadczenia usługi cyfrowej.",
      honesty: "Potwierdź zasady uczciwego oznaczania wizualizacji.",
      rights: "Potwierdź, że masz prawa do przesłanych zdjęć.",
    };
    for (const key of Object.keys(messages) as ConsentKey[]) {
      if (!consents[key]) errors[`consents.${key}`] = messages[key];
    }
    return errors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const errors = clientValidate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(Object.values(errors)[0]);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: uploads.done.map((item) => ({ tmpKey: item.tmpKey, name: item.name })),
          style,
          addons,
          express,
          notes,
          email,
          phone,
          name,
          company,
          nip,
          packageCode: code.state === "valid" ? code.code : undefined,
          referralCode,
          consents,
        }),
      });
      const body = (await response.json()) as ApiError & { url?: string };
      if (!response.ok || !body.url) {
        setFieldErrors(body.fields ?? {});
        setFormError(body.error ?? "Nie udało się złożyć zamówienia. Spróbuj ponownie.");
        setSubmitting(false);
        return;
      }
      if (body.url.startsWith("http")) {
        window.location.assign(body.url);
      } else {
        router.push(body.url);
      }
    } catch {
      setFormError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
      setSubmitting(false);
    }
  }

  const consentErrors: Partial<Record<ConsentKey, string>> = {
    terms: fieldErrors["consents.terms"],
    digital: fieldErrors["consents.digital"],
    honesty: fieldErrors["consents.honesty"],
    rights: fieldErrors["consents.rights"],
  };
  const submitLabel = submitting
    ? "Przetwarzanie…"
    : isFree
      ? "Złóż zamówienie (0 zł)"
      : "Przejdź do płatności";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
      <div className="space-y-6">
        <section className="card p-5 sm:p-7" aria-labelledby="krok-1">
          <div id="krok-1">
            <StepHeading
              n={1}
              title="Wgraj zdjęcia"
              description="Zdjęcia pustych pomieszczeń – najlepiej w poziomie, w dobrym świetle, z wysokości ok. 1,2–1,5 m."
            />
          </div>
          <PhotoDropzone
            uploads={uploads}
            maxFiles={MAX_PHOTOS}
            maxMb={maxMb}
            minShortSide={minShortSide}
            error={fieldErrors.photos}
          />
        </section>

        <section className="card p-5 sm:p-7" aria-labelledby="krok-2">
          <div id="krok-2">
            <StepHeading n={2} title="Styl i dodatki" description="Styl i dodatki obowiązują dla wszystkich zdjęć w zamówieniu." />
          </div>
          <StylePicker value={style} onChange={setStyle} />

          <fieldset className="mt-7">
            <legend className="text-base font-semibold text-ink">Dodatki (za każde zdjęcie)</legend>
            <div className="mt-3 space-y-2">
              {ADDONS.map((addon) => (
                <label
                  key={addon.slug}
                  className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 hover:border-brand/50 has-[:checked]:border-brand has-[:checked]:bg-brand-light/50"
                >
                  <input
                    type="checkbox"
                    checked={addons.includes(addon.slug)}
                    onChange={(event) => toggleAddon(addon.slug, event.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium text-ink">{addon.name}</span>
                      <span className="text-sm font-semibold text-brand">+{formatPLN(addon.pricePerPhoto)} / zdjęcie</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{addon.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex items-start justify-between gap-4 rounded-control border border-line bg-cream p-4">
            <div>
              <p id="ekspres-label" className="font-medium text-ink">
                Ekspres – gotowe w {SITE.expressHours} h
              </p>
              <p id="ekspres-opis" className="text-sm text-muted">
                +{Math.round(EXPRESS_RATE * 100)}% ceny bazowej zamówienia. Standardowo: {SITE.turnaroundHours} h.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={express}
              aria-labelledby="ekspres-label"
              aria-describedby="ekspres-opis"
              onClick={() => setExpress((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${express ? "bg-brand" : "bg-line"}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${express ? "translate-x-6" : "translate-x-1"}`}
                aria-hidden="true"
              />
            </button>
          </div>

          <FormField
            id="uwagi"
            label="Uwagi dla operatora"
            hint="Np. „nie usuwaj kuchni”, „sypialnia dla dziecka”, „zostaw zasłony”. Maks. 1000 znaków."
            error={fieldErrors.notes}
            className="mt-6"
          >
            <textarea
              id="uwagi"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={1000}
              aria-describedby="uwagi-opis"
              className={inputClass}
            />
          </FormField>
        </section>

        <section className="card p-5 sm:p-7" aria-labelledby="krok-3">
          <div id="krok-3">
            <StepHeading n={3} title="Twoje dane" description="Na adres e-mail wyślemy potwierdzenie i link do gotowych wizualizacji." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="email" label="E-mail" required error={fieldErrors.email} className="sm:col-span-2">
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby="email-opis"
                className={inputClass}
              />
            </FormField>
            <FormField id="telefon" label="Telefon" error={fieldErrors.phone} hint="Tylko w razie pytań do zdjęć.">
              <input
                id="telefon"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby="telefon-opis"
                className={inputClass}
              />
            </FormField>
            <FormField id="imie" label="Imię i nazwisko" error={fieldErrors.name}>
              <input
                id="imie"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-describedby="imie-opis"
                className={inputClass}
              />
            </FormField>
            <FormField id="firma" label="Firma" error={fieldErrors.company}>
              <input
                id="firma"
                autoComplete="organization"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                aria-describedby="firma-opis"
                className={inputClass}
              />
            </FormField>
            <FormField id="nip" label="NIP" error={fieldErrors.nip} hint="Podaj, jeśli potrzebujesz faktury VAT.">
              <input
                id="nip"
                inputMode="numeric"
                value={nip}
                onChange={(event) => setNip(event.target.value)}
                aria-invalid={Boolean(fieldErrors.nip)}
                aria-describedby="nip-opis"
                className={inputClass}
              />
            </FormField>
            <FormField
              id="kod-pakietu"
              label="Kod pakietu"
              error={fieldErrors.packageCode ?? (code.state === "invalid" ? code.message : undefined)}
              hint={
                code.state === "valid" ? (
                  <span className="font-medium text-success">
                    ✓ Kod ważny – dostępne kredyty: {code.credits} (pokrywa {formatPhotoCount(Math.min(code.credits, Math.max(photoCount, 1)))} bazowych w tym zamówieniu).
                  </span>
                ) : (
                  "1 kredyt = 1 zdjęcie bazowe. Dodatki i ekspres płatne osobno."
                )
              }
            >
              <div className="flex gap-2">
                <input
                  id="kod-pakietu"
                  value={codeInput}
                  onChange={(event) => {
                    setCodeInput(event.target.value.toUpperCase());
                    if (code.state !== "idle") setCode({ state: "idle" });
                  }}
                  placeholder="WS-XXXX-XXXX"
                  autoComplete="off"
                  aria-describedby="kod-pakietu-opis"
                  aria-invalid={code.state === "invalid"}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={checkCode}
                  disabled={code.state === "checking" || !codeInput.trim()}
                  className="btn-secondary shrink-0"
                >
                  {code.state === "checking" ? "Sprawdzam…" : "Sprawdź"}
                </button>
              </div>
            </FormField>
            <FormField
              id="kod-polecenia"
              label="Kod polecenia"
              error={fieldErrors.referralCode}
              hint="Od osoby, która nas poleciła."
            >
              <input
                id="kod-polecenia"
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value)}
                autoComplete="off"
                aria-describedby="kod-polecenia-opis"
                className={inputClass}
              />
            </FormField>
          </div>
        </section>

        <section className="card p-5 sm:p-7" aria-labelledby="zgody-title">
          <h2 id="zgody-title" className="mb-4 text-xl font-semibold text-ink">
            Zgody
          </h2>
          <ConsentFields value={consents} onChange={setConsents} errors={consentErrors} />
        </section>
      </div>

      <aside id="podsumowanie" className="lg:sticky lg:top-24" aria-labelledby="podsumowanie-title">
        <div className="card p-5 sm:p-6">
          <h2 id="podsumowanie-title" className="text-lg font-semibold text-ink">
            Podsumowanie
          </h2>
          <p className="mt-1 text-sm text-muted">
            {photoCount > 0
              ? formatPhotoCount(photoCount)
              : plannedPhotoCount
                ? `Planujesz ${formatPhotoCount(plannedPhotoCount)}`
                : "Brak zdjęć"}{" "}
            · {getStyle(style).name}
          </p>
          <div className="mt-4">
            <PriceSummary
              breakdown={breakdown}
              photoCount={photoCount}
              plannedPhotoCount={plannedPhotoCount}
              styleName={getStyle(style).name}
              turnaroundHours={turnaround}
            />
          </div>
          {formError && (
            <p className="mt-4 rounded-control bg-danger/10 px-3 py-2 text-sm font-medium text-danger" role="alert">
              {formError}
            </p>
          )}
          {!paymentsEnabled && !isFree && (
            <p className="mt-4 rounded-control bg-sand-light px-3 py-2 text-xs text-sand-dark">
              Płatności online są w trakcie konfiguracji. Zamówienie opłacone w całości kodem pakietu możesz złożyć już teraz.
            </p>
          )}
          <button type="submit" className="btn-primary mt-5 w-full text-base" disabled={submitting || uploads.pending}>
            {submitLabel}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            BLIK, karta lub Przelewy24 · bezpieczna płatność przez Stripe
          </p>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 shadow-lift backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{photoCount > 0 ? formatPhotoCount(photoCount) : "Razem"}</p>
            <p className="text-lg font-semibold tabular-nums text-ink">{formatPLN(breakdown.total)}</p>
          </div>
          <a href="#podsumowanie" className="btn-primary px-4">
            Podsumowanie
          </a>
        </div>
      </div>
    </form>
  );
}
