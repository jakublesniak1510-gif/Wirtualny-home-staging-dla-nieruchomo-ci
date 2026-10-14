import { useId } from "react";
import { ORDER_STATUS_LABELS, STATUS_TIMELINE } from "@/lib/orders";
import { SITE } from "@/lib/site";

const FONT = "ui-sans-serif, system-ui, 'Segoe UI', Roboto, Inter, sans-serif";
/** Który etap pokazujemy jako bieżący (indeks w STATUS_TIMELINE) – „Gotowe”. */
const CURRENT = 3;

/**
 * Schemat strony statusu zamówienia (SVG inline, nie zrzut) – pokazuje, co klient widzi po zapłacie:
 * oś etapów, miniatury z napisem „wizualizacja” i pobieranie ZIP. Etykiety z src/lib/orders.ts.
 */
export function ProcessPreview({ className = "" }: { className?: string }) {
  const titleId = useId();
  const descId = useId();
  const steps = STATUS_TIMELINE.map((status) => ORDER_STATUS_LABELS[status]);
  const x0 = 56;
  const span = 448 / (steps.length - 1);

  return (
    <svg
      viewBox="0 0 560 400"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className={`h-auto w-full ${className}`}
      style={{ fontFamily: FONT }}
    >
      <title id={titleId}>Podgląd strony statusu zamówienia</title>
      <desc id={descId}>
        {`Schemat: zamówienie przechodzi etapy ${steps.join(", ")}. Bieżący etap: ${steps[CURRENT]}. Trzy gotowe wizualizacje z napisem „wizualizacja” i przycisk pobierania wszystkich plików w ZIP.`}
      </desc>

      {/* okno przeglądarki */}
      <rect x="8" y="8" width="544" height="384" rx="18" fill="#ffffff" stroke="#e7e1d8" strokeWidth="2" />
      <path d="M8 26a18 18 0 0 1 18-18h508a18 18 0 0 1 18 18v20H8Z" fill="#f3eee6" />
      <circle cx="30" cy="27" r="5" fill="#e0b4a8" />
      <circle cx="47" cy="27" r="5" fill="#e6d3a3" />
      <circle cx="64" cy="27" r="5" fill="#b9cfb9" />
      <rect x="150" y="17" width="260" height="20" rx="10" fill="#ffffff" />
      <text x="280" y="31" textAnchor="middle" fontSize="10" fill="#5c5a57">
        {SITE.domain}/zamowienie/…
      </text>

      {/* nagłówek */}
      <text x="36" y="84" fontSize="11" fontWeight="600" fill="#7a5c33" letterSpacing="1.2">
        ZAMÓWIENIE WS-K3J9X0QZ
      </text>
      <text x="36" y="108" fontSize="20" fontWeight="700" fill="#1c1c1e">
        Twoje wizualizacje są gotowe
      </text>
      <rect x="430" y="70" width="94" height="26" rx="13" fill="#e4ede8" />
      <text x="477" y="87" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1f4d3a">
        {steps[CURRENT]}
      </text>

      {/* oś etapów */}
      <line x1={x0} y1="150" x2={x0 + span * (steps.length - 1)} y2="150" stroke="#e7e1d8" strokeWidth="4" strokeLinecap="round" />
      <line x1={x0} y1="150" x2={x0 + span * CURRENT} y2="150" stroke="#1f4d3a" strokeWidth="4" strokeLinecap="round" />
      {steps.map((label, index) => {
        const cx = x0 + span * index;
        const done = index < CURRENT;
        const current = index === CURRENT;
        return (
          <g key={label}>
            <circle
              cx={cx}
              cy="150"
              r={current ? 11 : 9}
              fill={done || current ? "#1f4d3a" : "#ffffff"}
              stroke={done || current ? "#1f4d3a" : "#cfc8bc"}
              strokeWidth="2"
            />
            {done && <path d={`M${cx - 4} 150.5l3 3 5.5-6`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            {current && <circle cx={cx} cy="150" r="4" fill="#fff" />}
            <text x={cx} y="178" textAnchor="middle" fontSize="10.5" fontWeight={current ? 700 : 500} fill={current ? "#1f4d3a" : "#5c5a57"}>
              {label}
            </text>
          </g>
        );
      })}

      {/* miniatury wyników */}
      {[0, 1, 2].map((i) => {
        const x = 36 + i * 166;
        const palettes = [
          ["#efebe4", "#d3d6d8", "#d4bb94"],
          ["#efebe4", "#3d4046", "#d4bb94"],
          ["#efebe4", "#bdb5a1", "#d4bb94"],
        ][i];
        return (
          <g key={i}>
            <rect x={x} y="204" width="154" height="102" rx="10" fill={palettes[0]} />
            <rect x={x} y="268" width="154" height="38" fill={palettes[2]} />
            <rect x={x + 10} y="214" width="34" height="40" rx="2" fill="#dbe8f0" stroke="#ffffff" strokeWidth="3" />
            <rect x={x + 46} y="246" width="80" height="26" rx="7" fill={palettes[1]} />
            <rect x={x + 54} y="236" width="64" height="16" rx="6" fill={palettes[1]} opacity="0.75" />
            <ellipse cx={x + 86} cy="288" rx="22" ry="5" fill="#c9a87c" />
            <text x={x + 146} y="298" textAnchor="end" fontSize="9" fontWeight="600" fill="#ffffff" stroke="#000" strokeOpacity="0.25" strokeWidth="0.6" paintOrder="stroke">
              wizualizacja
            </text>
            <rect x={x} y="204" width="154" height="102" rx="10" fill="none" stroke="#e7e1d8" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* akcje */}
      <rect x="36" y="326" width="196" height="40" rx="12" fill="#1f4d3a" />
      <path d="M58 338v12m0 0-5-5m5 5 5-5M52 354h12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="146" y="351" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#ffffff">
        Pobierz wszystko (ZIP)
      </text>
      <rect x="244" y="326" width="150" height="40" rx="12" fill="#ffffff" stroke="#e7e1d8" strokeWidth="1.5" />
      <text x="319" y="351" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#1f4d3a">
        Zgłoś poprawkę
      </text>
      <text x="524" y="351" textAnchor="end" fontSize="10.5" fill="#5c5a57">
        3 zdjęcia · styl skandynawski
      </text>
    </svg>
  );
}
