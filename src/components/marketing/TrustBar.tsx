import { FILE_RETENTION_DAYS } from "@/content/legal";

/** Ikony (dekoracyjne) – ścieżki w siatce 24×24. */
const ICONS = {
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm4.5-4.5h.01",
  invoice: "M6 3h9l4 4v14H6V3Zm9 0v4h4M9 11h7M9 15h7M9 7h3",
  phone: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h2",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4",
} as const;

const ITEMS: readonly { icon: keyof typeof ICONS; title: string; text: string }[] = [
  { icon: "tag", title: "Oznaczamy każdą wizualizację", text: "napis „wizualizacja” nakładany automatycznie" },
  { icon: "invoice", title: "Faktura VAT", text: "dla firm i biur, wysyłana e-mailem" },
  { icon: "phone", title: "Płatność BLIK", text: "a także karta i Przelewy24" },
  { icon: "shield", title: `RODO: pliki kasujemy po ${FILE_RETENTION_DAYS} dniach`, text: "automatycznie, bez przypominania" },
];

/** Pasek zaufania pod hero. */
export function TrustBar() {
  return (
    <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
              <path d={ICONS[item.icon]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">{item.title}</span>
            <span className="block text-xs text-muted">{item.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
