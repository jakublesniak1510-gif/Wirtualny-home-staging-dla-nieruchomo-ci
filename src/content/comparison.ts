/**
 * Porównanie: my vs alternatywy (kategorie, bez nazw konkretnych firm).
 * Ceny i terminy alternatyw – szacunki z src/content/market.ts; nasze – z src/lib/pricing.ts i src/lib/site.ts.
 */
import {
  AGENCY_COST_PER_PHOTO,
  AGENCY_DAYS,
  DIY_AI_COST_PER_PHOTO,
  PHYSICAL_STAGING_COST,
  PHYSICAL_STAGING_DAYS,
} from "@/content/market";
import { FILE_RETENTION_DAYS } from "@/content/legal";
import { SUPPORT_HOURS } from "@/content/service";
import { formatPLNShort } from "@/lib/format";
import { INCLUDED_REVISIONS, PRICE_BULK, PRICE_SINGLE, REVISION_WINDOW_DAYS } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const COMPARISON_OPTIONS = [
  { id: "my", name: SITE.name, short: "My", note: "wirtualny staging z kontrolą człowieka" },
  { id: "fizyczny", name: "Fizyczny home staging", short: "Fizyczny staging", note: "prawdziwe meble i stylista" },
  { id: "ai-diy", name: "Narzędzia AI „zrób to sam”", short: "AI „zrób to sam”", note: "zagraniczne aplikacje online" },
  { id: "agencja", name: "Agencja graficzna", short: "Agencja graficzna", note: "studio wizualizacji, wycena indywidualna" },
] as const;

export type ComparisonOptionId = (typeof COMPARISON_OPTIONS)[number]["id"];

/** yes = spełnia, partial = częściowo / zależy, no = nie, na = nie dotyczy. */
export type ComparisonLevel = "yes" | "partial" | "no" | "na";

export interface ComparisonCell {
  level: ComparisonLevel;
  text: string;
}

export interface ComparisonCriterion {
  id: string;
  label: string;
  /** Krótkie wyjaśnienie kryterium (pod nazwą wiersza). */
  hint?: string;
  /** Pokaż w skróconej tabeli na stronie głównej. */
  onHome: boolean;
  cells: Record<ComparisonOptionId, ComparisonCell>;
}

const range = (r: { min: number; max: number }) => `${formatPLNShort(r.min)}–${formatPLNShort(r.max)}`;

export const COMPARISON_CRITERIA: readonly ComparisonCriterion[] = [
  {
    id: "cena",
    label: "Cena",
    hint: "brutto, orientacyjnie",
    onHome: true,
    cells: {
      my: { level: "yes", text: `${formatPLNShort(PRICE_SINGLE)} za zdjęcie, od ${formatPLNShort(PRICE_BULK)} przy większych zamówieniach` },
      fizyczny: { level: "no", text: `${range(PHYSICAL_STAGING_COST)} za mieszkanie` },
      "ai-diy": { level: "yes", text: `ok. ${range(DIY_AI_COST_PER_PHOTO)} za zdjęcie w abonamencie (w USD/EUR)` },
      agencja: { level: "partial", text: `ok. ${range(AGENCY_COST_PER_PHOTO)} za zdjęcie` },
    },
  },
  {
    id: "czas",
    label: "Czas realizacji",
    onHome: true,
    cells: {
      my: { level: "yes", text: `do ${SITE.turnaroundHours} h, ekspres do ${SITE.expressHours} h` },
      fizyczny: { level: "no", text: `${PHYSICAL_STAGING_DAYS.min}–${PHYSICAL_STAGING_DAYS.max} dni + sesja zdjęciowa` },
      "ai-diy": { level: "yes", text: "minuty – ale wybór i poprawki robisz sam" },
      agencja: { level: "partial", text: `${AGENCY_DAYS.min}–${AGENCY_DAYS.max} dni roboczych` },
    },
  },
  {
    id: "kontrola",
    label: "Kontrola jakości przez człowieka",
    hint: "proporcje mebli, cienie, błędy generowania",
    onHome: true,
    cells: {
      my: { level: "yes", text: "każde zdjęcie: wybór najlepszego wariantu i ręczny retusz" },
      fizyczny: { level: "yes", text: "stylista na miejscu" },
      "ai-diy": { level: "no", text: "brak – błędy AI (krzywe meble, „pływające” przedmioty) wyłapujesz sam" },
      agencja: { level: "yes", text: "grafik przygotowuje każde zdjęcie" },
    },
  },
  {
    id: "poprawki",
    label: "Poprawki w cenie",
    onHome: false,
    cells: {
      my: { level: "yes", text: `${INCLUDED_REVISIONS} bezpłatna poprawka w ciągu ${REVISION_WINDOW_DAYS} dni` },
      fizyczny: { level: "na", text: "zmiana aranżacji to zwykle dodatkowy koszt" },
      "ai-diy": { level: "partial", text: "nielimitowane generowanie, ale każdą poprawkę robisz sam" },
      agencja: { level: "partial", text: "zależnie od umowy, często 1–2 rundy" },
    },
  },
  {
    id: "jezyk-faktura",
    label: "Polski język i faktura VAT",
    onHome: true,
    cells: {
      my: { level: "yes", text: "obsługa po polsku, faktura VAT z polskim NIP" },
      fizyczny: { level: "yes", text: "zwykle tak (firmy lokalne)" },
      "ai-diy": { level: "no", text: "interfejs i pomoc najczęściej po angielsku, faktura zagraniczna" },
      agencja: { level: "yes", text: "zwykle tak" },
    },
  },
  {
    id: "blik",
    label: "Płatność BLIK",
    onHome: true,
    cells: {
      my: { level: "yes", text: "BLIK, karta, Przelewy24 – od razu przy zamówieniu" },
      fizyczny: { level: "partial", text: "najczęściej przelew po wycenie" },
      "ai-diy": { level: "no", text: "zwykle tylko karta, płatność w obcej walucie" },
      agencja: { level: "partial", text: "najczęściej przelew po wycenie" },
    },
  },
  {
    id: "oznaczenie",
    label: "Oznaczenie wizualizacji i uczciwość",
    hint: "ochrona przed zarzutem wprowadzania kupujących w błąd",
    onHome: true,
    cells: {
      my: { level: "yes", text: "napis „wizualizacja” nakładany automatycznie; nie ukrywamy wad, nie zmieniamy metrażu" },
      fizyczny: { level: "na", text: "nie dotyczy – meble są prawdziwe" },
      "ai-diy": { level: "partial", text: "po Twojej stronie – narzędzie nie pilnuje zasad" },
      agencja: { level: "partial", text: "zależy od zlecenia" },
    },
  },
  {
    id: "dane",
    label: "Twoje zdjęcia i RODO",
    onHome: false,
    cells: {
      my: { level: "yes", text: `pliki usuwamy po ${FILE_RETENTION_DAYS} dniach; używamy tylko narzędzi, które nie trenują modeli na Twoich zdjęciach` },
      fizyczny: { level: "na", text: "nie dotyczy" },
      "ai-diy": { level: "partial", text: "często serwery poza UE; sprawdź w regulaminie, czy zdjęcia nie służą do trenowania modeli" },
      agencja: { level: "partial", text: "zależy od umowy" },
    },
  },
  {
    id: "wsparcie",
    label: "Wsparcie",
    onHome: false,
    cells: {
      my: { level: "yes", text: `e-mail i telefon, ${SUPPORT_HOURS.days} ${SUPPORT_HOURS.hours}` },
      fizyczny: { level: "yes", text: "kontakt osobisty" },
      "ai-diy": { level: "partial", text: "czat lub e-mail po angielsku" },
      agencja: { level: "yes", text: "opiekun projektu" },
    },
  },
];

/** Kiedy która opcja ma sens – uczciwie, także gdy nie my. */
export const WHEN_TO_CHOOSE: Record<ComparisonOptionId, string> = {
  my: "Gdy potrzebujesz dobrych zdjęć do ogłoszenia szybko i w przewidywalnej cenie – od jednego mieszkania do kilkudziesięciu ofert miesięcznie.",
  fizyczny:
    "Gdy sprzedajesz nieruchomość z wyższej półki i planujesz dni otwarte – kupujący zobaczą umeblowane wnętrze także na żywo.",
  "ai-diy":
    "Gdy masz czas, by samodzielnie generować i wybierać warianty, swobodnie poruszasz się po angielskim interfejsie i potrzebujesz bardzo dużej liczby zdjęć.",
  agencja:
    "Gdy potrzebujesz pełnej wizualizacji 3D lokalu, który jeszcze nie istnieje (np. z rzutu), albo materiałów do kampanii reklamowej.",
};
