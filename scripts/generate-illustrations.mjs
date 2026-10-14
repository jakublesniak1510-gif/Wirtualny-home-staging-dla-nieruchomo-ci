// Generator poglądowych ilustracji portfolio (przed/po) oraz obrazka OpenGraph.
// Użycie: node scripts/generate-illustrations.mjs  (zapisuje do ./public)
// Wynik: public/portfolio/{slug}-przed.svg, {slug}-po.svg,
//        public/portfolio/salon-demo-przed.svg, salon-demo-{slug}.svg (przełącznik „Ten sam pokój w 6 stylach”),
//        public/og.svg, public/og.png
// Prawdziwe zdjęcia podmieniasz w src/content/portfolio.ts – ten skrypt nie jest wtedy potrzebny.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT = process.argv[2] ?? join(process.cwd(), "public");
mkdirSync(join(OUT, "portfolio"), { recursive: true });

const FONT = "ui-sans-serif, system-ui, 'Segoe UI', Roboto, Inter, sans-serif";

// Geometria pokoju (perspektywa jednopunktowa, punkt zbiegu VP)
const VP = { x: 600, y: 330 };
const BW = { x1: 300, x2: 900, y1: 165, y2: 565 }; // ściana tylna

const pts = (arr) => arr.map(([x, y]) => `${x},${y}`).join(" ");
const poly = (arr, attrs) => `<polygon points="${pts(arr)}" ${attrs}/>`;

// punkt na prostej z VP przez (x0,y0) przy danym y
function alongVP(x0, y0, y) {
  const t = (y - VP.y) / (y0 - VP.y);
  return VP.x + (x0 - VP.x) * t;
}

function floorPattern(c) {
  let s = "";
  // linie zbiegające się (deski / fugi)
  const step = c.floorType === "tiles" ? 100 : 50;
  for (let xb = BW.x1; xb <= BW.x2; xb += step) {
    const xBottom = VP.x + 2 * (xb - VP.x);
    s += `<line x1="${xb}" y1="${BW.y2}" x2="${xBottom}" y2="800" stroke="${c.floorLine}" stroke-width="${c.floorType === "tiles" ? 2 : 1.5}" opacity=".7"/>`;
  }
  // poprzeczne fugi / łączenia
  const rows = c.floorType === "tiles" ? [592, 628, 676, 740] : [585, 610, 640, 676, 720, 772];
  rows.forEach((y, i) => {
    const xl = alongVP(0, 800, y);
    const xr = alongVP(1200, 800, y);
    if (c.floorType === "tiles") {
      s += `<line x1="${xl}" y1="${y}" x2="${xr}" y2="${y}" stroke="${c.floorLine}" stroke-width="2" opacity=".7"/>`;
    } else {
      // krótkie odcinki w przesunięciu – imitacja łączeń desek
      const n = 9;
      for (let k = 0; k < n; k++) {
        if ((k + i) % 3 !== 0) continue;
        const a = xl + ((xr - xl) * k) / n;
        const b = xl + ((xr - xl) * (k + 1)) / n;
        s += `<line x1="${a.toFixed(1)}" y1="${y}" x2="${b.toFixed(1)}" y2="${y}" stroke="${c.floorLine}" stroke-width="1.2" opacity=".55"/>`;
      }
    }
  });
  return s;
}

function backWallFeature(c) {
  if (c.backFeature === "brick") {
    return `<rect x="${BW.x1}" y="${BW.y1}" width="${BW.x2 - BW.x1}" height="${BW.y2 - BW.y1}" fill="url(#brick)"/>`;
  }
  if (c.backFeature === "moulding") {
    const panel = (x1, x2) =>
      `<rect x="${x1}" y="225" width="${x2 - x1}" height="280" fill="none" stroke="#ffffff" stroke-width="5" opacity=".8"/>` +
      `<rect x="${x1 + 4}" y="229" width="${x2 - x1 - 8}" height="272" fill="none" stroke="${c.wallShade}" stroke-width="1.5" opacity=".6"/>`;
    return (
      `<rect x="${BW.x1}" y="${BW.y1}" width="${BW.x2 - BW.x1}" height="16" fill="#ffffff" opacity=".7"/>` +
      `<rect x="${BW.x1}" y="${BW.y1 + 16}" width="${BW.x2 - BW.x1}" height="3" fill="${c.wallShade}" opacity=".5"/>` +
      panel(335, 580) +
      panel(620, 865)
    );
  }
  return "";
}

function windowLeft(c) {
  // okno na lewej ścianie, krawędzie zbiegają się w VP
  const top = (x) => 180 + 0.25 * x;
  const bot = (x) => 560 - 0.3833 * x;
  const mid = (x) => 370 - 0.0667 * x;
  const xa = 70;
  const xb = 230;
  const xm = 150;
  const glass = [
    [xa, top(xa)],
    [xb, top(xb)],
    [xb, bot(xb)],
    [xa, bot(xa)],
  ];
  const fw = c.industrialWindow ? 7 : 9;
  let s = poly(glass, `fill="url(#sky)"`);
  s += poly(glass, `fill="none" stroke="${c.windowFrame}" stroke-width="${fw + 3}" stroke-linejoin="round"`);
  s += `<line x1="${xm}" y1="${top(xm)}" x2="${xm}" y2="${bot(xm)}" stroke="${c.windowFrame}" stroke-width="${fw}"/>`;
  s += `<line x1="${xa}" y1="${mid(xa)}" x2="${xb}" y2="${mid(xb)}" stroke="${c.windowFrame}" stroke-width="${fw}"/>`;
  if (c.industrialWindow) {
    for (const f of [0.25, 0.75]) {
      const x = xa + (xb - xa) * f;
      s += `<line x1="${x}" y1="${top(x)}" x2="${x}" y2="${bot(x)}" stroke="${c.windowFrame}" stroke-width="4"/>`;
    }
    for (const k of [0.25, 0.75]) {
      const ya = top(xa) + (bot(xa) - top(xa)) * k;
      const yb = top(xb) + (bot(xb) - top(xb)) * k;
      s += `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="${c.windowFrame}" stroke-width="4"/>`;
    }
  }
  // parapet
  s += poly(
    [
      [xa - 8, bot(xa) + 4],
      [xb + 6, bot(xb) + 2],
      [xb + 6, bot(xb) + 12],
      [xa - 8, bot(xa) + 18],
    ],
    `fill="${c.baseboard}" stroke="${c.wallShade}" stroke-width="1"`,
  );
  return s;
}

function room(c) {
  const defs = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cfe2ee"/>
      <stop offset="1" stop-color="#f4f8fa"/>
    </linearGradient>
    <linearGradient id="leftShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".02"/>
      <stop offset="1" stop-color="#000" stop-opacity=".08"/>
    </linearGradient>
    <linearGradient id="rightShade" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".1"/>
      <stop offset="1" stop-color="#000" stop-opacity=".04"/>
    </linearGradient>
    <linearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <pattern id="brick" width="60" height="30" patternUnits="userSpaceOnUse" x="${BW.x1}" y="${BW.y1}">
      <rect width="60" height="30" fill="${c.brick ?? c.wallBack}"/>
      <path d="M0 0.5H60M0 15.5H60M30 0V15M0 15V30M60 15V30" stroke="${c.mortar ?? "#ccc"}" stroke-width="2.5"/>
    </pattern>
  </defs>`;
  let s = defs;
  // sufit
  s += poly([[0, 0], [1200, 0], [BW.x2, BW.y1], [BW.x1, BW.y1]], `fill="${c.ceiling}"`);
  // ściany boczne
  s += poly([[0, 0], [BW.x1, BW.y1], [BW.x1, BW.y2], [0, 800]], `fill="${c.wallSide}"`);
  s += poly([[0, 0], [BW.x1, BW.y1], [BW.x1, BW.y2], [0, 800]], `fill="url(#leftShade)"`);
  s += poly([[1200, 0], [BW.x2, BW.y1], [BW.x2, BW.y2], [1200, 800]], `fill="${c.wallSide}"`);
  s += poly([[1200, 0], [BW.x2, BW.y1], [BW.x2, BW.y2], [1200, 800]], `fill="url(#rightShade)"`);
  // ściana tylna
  s += `<rect x="${BW.x1}" y="${BW.y1}" width="${BW.x2 - BW.x1}" height="${BW.y2 - BW.y1}" fill="${c.wallBack}"/>`;
  s += backWallFeature(c);
  // podłoga
  s += poly([[0, 800], [BW.x1, BW.y2], [BW.x2, BW.y2], [1200, 800]], `fill="${c.floor}"`);
  s += floorPattern(c);
  s += poly([[0, 800], [BW.x1, BW.y2], [BW.x2, BW.y2], [1200, 800]], `fill="url(#floorShade)" opacity=".6"`);
  // listwy przypodłogowe
  s += `<rect x="${BW.x1}" y="${BW.y2 - 12}" width="${BW.x2 - BW.x1}" height="12" fill="${c.baseboard}"/>`;
  s += poly([[0, 800], [BW.x1, BW.y2], [BW.x1, BW.y2 - 12], [0, 778]], `fill="${c.baseboard}"`);
  s += poly([[1200, 800], [BW.x2, BW.y2], [BW.x2, BW.y2 - 12], [1200, 778]], `fill="${c.baseboard}"`);
  // narożniki
  s += `<path d="M${BW.x1} ${BW.y1}V${BW.y2}M${BW.x2} ${BW.y1}V${BW.y2}" stroke="#000" stroke-opacity=".08" stroke-width="2"/>`;
  s += windowLeft(c);
  // smuga światła z okna
  s += poly([[60, 800], [200, 640], [400, 655], [340, 800]], `fill="#fff" opacity=".14"`);
  return s;
}

// ---------- meble ----------
function shadow(cx, cy, rx, ry, op = 0.16) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${op}"/>`;
}

function sofa({ cx = 600, w = 440, seatY = 520, backTop = 455, body, shade, legs, round = false, cushions = [] }) {
  const x0 = cx - w / 2;
  const seatH = 62;
  let s = shadow(cx, seatY + 80, w / 2 + 30, 14);
  s += `<rect x="${x0 + 16}" y="${backTop}" width="${w - 32}" height="${seatY + 24 - backTop}" rx="18" fill="${shade}"/>`;
  // poduchy oparcia
  const n = 3;
  const bw = (w - 60) / n;
  for (let i = 0; i < n; i++) {
    s += `<rect x="${x0 + 30 + i * bw + 3}" y="${backTop + 8}" width="${bw - 6}" height="${seatY - backTop}" rx="14" fill="${body}" opacity=".55"/>`;
  }
  s += `<rect x="${x0}" y="${seatY}" width="${w}" height="${seatH}" rx="14" fill="${body}"/>`;
  s += `<path d="M${x0 + 30 + bw} ${seatY + 6}v26M${x0 + 30 + 2 * bw} ${seatY + 6}v26" stroke="${shade}" stroke-width="3" stroke-linecap="round"/>`;
  // podłokietniki
  const armR = round ? 28 : 14;
  s += `<rect x="${x0 - 14}" y="${seatY - 38}" width="54" height="${seatH + 40}" rx="${armR}" fill="${body}"/>`;
  s += `<rect x="${x0 + w - 40}" y="${seatY - 38}" width="54" height="${seatH + 40}" rx="${armR}" fill="${body}"/>`;
  s += `<rect x="${x0 - 14}" y="${seatY - 38}" width="54" height="${seatH + 40}" rx="${armR}" fill="#000" opacity=".05"/>`;
  // nóżki
  s += `<rect x="${x0 + 4}" y="${seatY + seatH}" width="9" height="16" rx="2" fill="${legs}"/>`;
  s += `<rect x="${x0 + w - 13}" y="${seatY + seatH}" width="9" height="16" rx="2" fill="${legs}"/>`;
  // poduszki dekoracyjne
  const spots = [
    [x0 + 55, -9],
    [x0 + w - 115, 8],
    [cx - 30, -3],
  ];
  cushions.forEach((col, i) => {
    const [x, rot] = spots[i];
    s += `<rect x="${x}" y="${seatY - 50}" width="60" height="54" rx="12" fill="${col}" transform="rotate(${rot} ${x + 30} ${seatY - 23})"/>`;
  });
  return s;
}

function rugTrapezoid(fill, border, stripes) {
  const far = 598;
  const near = 782;
  const xl = (y) => alongVP(230, near, y);
  const xr = (y) => alongVP(970, near, y);
  let s = poly([[xl(far), far], [xr(far), far], [xr(near), near], [xl(near), near]], `fill="${fill}"`);
  const fi = far + 10;
  const ni = near - 14;
  s += poly(
    [[xl(fi) + 22, fi], [xr(fi) - 22, fi], [xr(ni) - 30, ni], [xl(ni) + 30, ni]],
    `fill="none" stroke="${border}" stroke-width="4"`,
  );
  if (stripes) {
    for (const y of [650, 700]) {
      s += `<line x1="${xl(y) + 30}" y1="${y}" x2="${xr(y) - 30}" y2="${y}" stroke="${border}" stroke-width="3" opacity=".7"/>`;
    }
  }
  return s;
}

function tableRound({ cx = 600, cy = 662, rx = 105, top, legs }) {
  let s = shadow(cx, cy + 58, rx * 0.9, 12, 0.14);
  s += `<path d="M${cx - rx * 0.6} ${cy + 6}L${cx - rx * 0.7} ${cy + 56}M${cx + rx * 0.6} ${cy + 6}L${cx + rx * 0.7} ${cy + 56}M${cx} ${cy + 16}V${cy + 60}" stroke="${legs}" stroke-width="6" stroke-linecap="round"/>`;
  s += `<ellipse cx="${cx}" cy="${cy + 6}" rx="${rx}" ry="20" fill="#000" opacity=".12"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="20" fill="${top}"/>`;
  return s;
}

function tableRect({ cx = 600, y = 650, w = 280, h = 52, top, side, legs, low = false }) {
  const x0 = cx - w / 2;
  const legH = low ? 26 : h;
  let s = shadow(cx, y + 24 + legH, w / 2 + 10, 10, 0.14);
  s += poly([[x0 + 20, y], [x0 + w - 20, y], [x0 + w, y + 20], [x0, y + 20]], `fill="${top}"`);
  s += `<rect x="${x0}" y="${y + 20}" width="${w}" height="10" fill="${side}"/>`;
  s += `<rect x="${x0 + 6}" y="${y + 30}" width="9" height="${legH}" fill="${legs}"/><rect x="${x0 + w - 15}" y="${y + 30}" width="9" height="${legH}" fill="${legs}"/>`;
  return s;
}

function floorLamp({ x = 880, base = 640, top = 360, pole = "#2e2e2e", shadeCol = "#f4f1ea" }) {
  let s = shadow(x, base + 4, 34, 7);
  s += `<ellipse cx="${x}" cy="${base}" rx="26" ry="6" fill="${pole}"/>`;
  s += `<rect x="${x - 2.5}" y="${top + 40}" width="5" height="${base - top - 40}" fill="${pole}"/>`;
  s += poly([[x - 34, top], [x + 34, top], [x + 48, top + 58], [x - 48, top + 58]], `fill="${shadeCol}"`);
  s += `<ellipse cx="${x}" cy="${top + 58}" rx="48" ry="6" fill="#fff6dc" opacity=".9"/>`;
  return s;
}

function plant({ x = 270, base = 650, pot = "#ffffff", leaves = ["#5f8a5a", "#4d7a4a"], tall = 1 }) {
  let s = shadow(x, base + 2, 48, 8);
  s += poly([[x - 38, base - 72], [x + 38, base - 72], [x + 28, base], [x - 28, base]], `fill="${pot}"`);
  s += `<rect x="${x - 42}" y="${base - 80}" width="84" height="10" rx="3" fill="${pot}"/>`;
  s += poly([[x - 38, base - 72], [x + 38, base - 72], [x + 28, base], [x - 28, base]], `fill="#000" opacity=".06"`);
  const L = [
    [-40, -150, -35],
    [35, -165, 30],
    [-8, -205, -5],
    [-55, -110, -60],
    [52, -118, 55],
    [12, -140, 15],
  ];
  L.forEach(([dx, dy, rot], i) => {
    const cx = x + dx;
    const cy = base - 80 + (dy + 80) * tall;
    s += `<path d="M${x} ${base - 78}Q${x + dx * 0.4} ${cy + 40} ${cx} ${cy}" stroke="${leaves[1]}" stroke-width="3" fill="none"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="22" ry="44" fill="${leaves[i % 2]}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  });
  return s;
}

function snakePlant({ x = 300, base = 650, pot = "#1c1c1e" }) {
  let s = shadow(x, base + 2, 40, 7);
  for (const [dx, h, rot, col] of [
    [-18, 170, -10, "#4f7a52"],
    [0, 210, 0, "#5f8d5f"],
    [18, 160, 9, "#47704a"],
    [-6, 130, -4, "#6a9a68"],
  ]) {
    s += `<path d="M${x + dx - 9} ${base - 60}Q${x + dx - 6} ${base - 60 - h * 0.6} ${x + dx} ${base - 60 - h}Q${x + dx + 6} ${base - 60 - h * 0.6} ${x + dx + 9} ${base - 60}Z" fill="${col}" transform="rotate(${rot} ${x + dx} ${base - 60})"/>`;
  }
  s += `<rect x="${x - 34}" y="${base - 64}" width="68" height="64" rx="6" fill="${pot}"/>`;
  return s;
}

function art({ x = 520, y = 255, w = 160, h = 115, frame = "#2e2e2e", bg = "#f7f5f1", inner = "" }) {
  return (
    `<rect x="${x + 4}" y="${y + 6}" width="${w}" height="${h}" fill="#000" opacity=".1"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${frame}"/>` +
    `<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" fill="${bg}"/>` +
    inner
  );
}

function pendant({ x = 600, y0 = 70, y = 200, col = "#ffffff", kind = "dome" }) {
  let s = `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y}" stroke="#3a3a3a" stroke-width="2"/>`;
  if (kind === "dome") {
    s += `<path d="M${x - 45} ${y + 38}Q${x - 45} ${y} ${x} ${y}Q${x + 45} ${y} ${x + 45} ${y + 38}Z" fill="${col}"/>`;
    s += `<ellipse cx="${x}" cy="${y + 38}" rx="45" ry="6" fill="#fff6dc"/>`;
  } else if (kind === "industrial") {
    s += `<path d="M${x - 10} ${y}h20l35 40h-90Z" fill="${col}"/>`;
    s += `<circle cx="${x}" cy="${y + 46}" r="10" fill="#ffe7a8"/>`;
  } else if (kind === "rattan") {
    s += `<ellipse cx="${x}" cy="${y + 30}" rx="55" ry="36" fill="${col}"/>`;
    for (let k = -40; k <= 40; k += 13) {
      s += `<path d="M${x + k} ${y + 2}Q${x + k * 1.3} ${y + 30} ${x + k} ${y + 60}" stroke="#a87a45" stroke-width="2" fill="none"/>`;
    }
    s += `<path d="M${x - 55} ${y + 30}H${x + 55}" stroke="#a87a45" stroke-width="2"/>`;
  } else if (kind === "lantern") {
    s += `<circle cx="${x}" cy="${y + 34}" r="40" fill="${col}"/>`;
    for (const dy of [12, 24, 36, 48, 60]) {
      const half = Math.sqrt(Math.max(0, 40 * 40 - (dy - 34) ** 2));
      s += `<line x1="${x - half}" y1="${y + dy}" x2="${x + half}" y2="${y + dy}" stroke="#d9cfbd" stroke-width="1.5"/>`;
    }
  } else if (kind === "bulb") {
    s += `<rect x="${x - 6}" y="${y - 4}" width="12" height="10" fill="#555"/>`;
    s += `<circle cx="${x}" cy="${y + 16}" r="12" fill="#fff4cf" stroke="#d8cfae"/>`;
  }
  return s;
}

function chandelier({ x = 600, y0 = 60, y = 190 }) {
  const gold = "#c9a87c";
  let s = `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y}" stroke="${gold}" stroke-width="3"/>`;
  s += `<path d="M${x - 90} ${y + 10}Q${x} ${y + 60} ${x + 90} ${y + 10}" stroke="${gold}" stroke-width="5" fill="none"/>`;
  s += `<path d="M${x - 50} ${y + 5}Q${x} ${y + 40} ${x + 50} ${y + 5}" stroke="${gold}" stroke-width="4" fill="none"/>`;
  for (const dx of [-90, -50, 0, 50, 90]) {
    const cy = dx === 0 ? y + 30 : Math.abs(dx) === 50 ? y + 8 : y + 12;
    s += `<rect x="${x + dx - 4}" y="${cy - 26}" width="8" height="24" fill="#fbf7ef"/>`;
    s += `<ellipse cx="${x + dx}" cy="${cy - 31}" rx="5" ry="8" fill="#ffd879"/>`;
    s += `<ellipse cx="${x + dx}" cy="${cy}" rx="11" ry="4" fill="${gold}"/>`;
  }
  return s;
}

// Znak „wizualizacja” na półprzezroczystej „pigułce” – czytelny na jasnym i ciemnym tle.
const watermark = `<rect x="956" y="732" width="220" height="48" rx="24" fill="#000000" fill-opacity=".34"/><text x="1066" y="765" text-anchor="middle" font-family="${FONT}" font-size="27" font-weight="600" fill="#ffffff" fill-opacity=".92">wizualizacja</text>`;

const outlet = `<rect x="830" y="505" width="22" height="30" rx="3" fill="#fbfaf7" stroke="#cfc8bc"/><circle cx="841" cy="515" r="2" fill="#999"/><circle cx="841" cy="525" r="2" fill="#999"/>`;

// ---------- konfiguracje stylów ----------
const ROOMS = {
  skandynawski: {
    room: { wallBack: "#f1eee8", wallSide: "#e7e2d9", wallShade: "#d8d1c4", ceiling: "#f8f6f2", floor: "#d8c19c", floorLine: "#bfa47b", floorType: "planks", baseboard: "#fbfaf7", windowFrame: "#ffffff" },
    furniture() {
      return (
        rugTrapezoid("#f3efe8", "#c9c3b8", true) +
        art({ inner: `<path d="M548 340a40 40 0 0 1 80 0" fill="#8fa3b5"/><circle cx="640" cy="300" r="18" fill="#e2c46b"/>` }) +
        pendant({ col: "#ffffff" }) +
        sofa({ body: "#d3d6d8", shade: "#bcc1c4", legs: "#b48e5f", cushions: ["#8fa3b5", "#e2c46b", "#f4f1ea"] }) +
        tableRound({ top: "#dcc196", legs: "#b48e5f" }) +
        `<rect x="575" y="640" width="26" height="14" rx="3" fill="#8fa3b5"/><ellipse cx="625" cy="652" rx="14" ry="5" fill="#f4f1ea"/>` +
        floorLamp({ x: 880, top: 350 }) +
        plant({ x: 260, pot: "#ffffff" })
      );
    },
  },
  nowoczesny: {
    room: { wallBack: "#e4e4e2", wallSide: "#d7d7d4", wallShade: "#c4c4c0", ceiling: "#f1f1ef", floor: "#b5b2ad", floorLine: "#9c9892", floorType: "tiles", baseboard: "#cfcfcb", windowFrame: "#3a3d42" },
    furniture() {
      return (
        rugTrapezoid("#6f7074", "#8b8c90", false) +
        art({ x: 470, y: 250, w: 260, h: 120, frame: "#1c1c1e", bg: "#f4f2ee", inner: `<circle cx="545" cy="312" r="34" fill="#b0896b"/><rect x="595" y="270" width="60" height="80" fill="#1c1c1e"/><rect x="665" y="300" width="45" height="50" fill="#c9c6c0"/>` }) +
        sofa({ body: "#3d4046", shade: "#2c2f33", legs: "#111111", cushions: ["#b0896b", "#d9d4cc"] }) +
        tableRect({ top: "#1f1f21", side: "#111111", legs: "#111111", w: 300 }) +
        `<rect x="560" y="640" width="70" height="8" rx="2" fill="#b0896b"/>` +
        // lampa łukowa
        shadow(880, 644, 36, 7) +
        `<rect x="855" y="628" width="50" height="14" rx="4" fill="#9aa0a6"/>` +
        `<path d="M880 630V360Q880 250 740 300" stroke="#9aa0a6" stroke-width="6" fill="none"/>` +
        `<path d="M700 330Q700 290 740 290Q780 290 780 330Z" fill="#1c1c1e"/><ellipse cx="740" cy="330" rx="40" ry="5" fill="#fff6dc"/>` +
        snakePlant({ x: 285 })
      );
    },
  },
  loft: {
    room: { wallBack: "#9a5a43", brick: "#9a5a43", mortar: "#c7a48f", wallSide: "#d9d2c8", wallShade: "#bfb5a8", ceiling: "#d2cbc0", floor: "#6b4a35", floorLine: "#4f3626", floorType: "planks", baseboard: "#3a2a20", windowFrame: "#2b2b2b", backFeature: "brick", industrialWindow: true },
    furniture() {
      return (
        rugTrapezoid("#7e5a4a", "#c29a76", true) +
        art({ x: 515, y: 245, w: 170, h: 120, frame: "#1c1c1c", bg: "#ebe4d8", inner: `<path d="M535 345V315h18v-20h16v35h14v-50h20v60h16v-30h16v30h20" stroke="#1c1c1c" stroke-width="5" fill="none"/>` }) +
        pendant({ kind: "industrial", col: "#1c1c1c", y: 190 }) +
        sofa({ body: "#8b4a2b", shade: "#6f3a21", legs: "#1c1c1c", cushions: ["#d6c6a8", "#4a5a4f"] }) +
        // stolik metal + drewno
        tableRect({ top: "#5a3e2b", side: "#3d2a1d", legs: "#1c1c1c", w: 280 }) +
        `<rect x="470" y="700" width="260" height="5" fill="#1c1c1c"/>` +
        // lampa na trójnogu
        shadow(880, 646, 44, 8) +
        `<path d="M880 420L845 645M880 420L915 645M880 420L882 625" stroke="#1c1c1c" stroke-width="5" stroke-linecap="round"/>` +
        `<rect x="842" y="360" width="76" height="62" rx="8" fill="#1c1c1c" transform="rotate(-10 880 390)"/>` +
        `<ellipse cx="872" cy="425" rx="34" ry="6" fill="#ffe7a8" transform="rotate(-10 880 390)"/>` +
        plant({ x: 262, pot: "#3a3a3a", leaves: ["#5b7d4f", "#476a3e"] })
      );
    },
  },
  klasyczny: {
    room: { wallBack: "#efe6d8", wallSide: "#e5dac8", wallShade: "#cdbfa8", ceiling: "#f7f1e8", floor: "#b98a5b", floorLine: "#9b6f44", floorType: "planks", baseboard: "#fbf7f0", windowFrame: "#fbf7f0", backFeature: "moulding" },
    furniture() {
      const gold = "#c9a87c";
      return (
        rugTrapezoid("#e7d9c0", "#8a3b32", true) +
        art({ x: 405, y: 270, w: 100, h: 80, frame: gold, bg: "#4f6a55", inner: `<path d="M413 342L440 300L462 325L478 308L497 342Z" fill="#2f4535"/><circle cx="480" cy="292" r="8" fill="#f1e2b5"/>` }) +
        art({ x: 695, y: 270, w: 100, h: 80, frame: gold, bg: "#6b5a7a", inner: `<ellipse cx="745" cy="312" rx="22" ry="26" fill="#d9b9a6"/><rect x="725" y="330" width="40" height="12" fill="#3b2f48"/>` }) +
        chandelier({}) +
        sofa({ body: "#2d3e5c", shade: "#22314a", legs: gold, round: true, cushions: [gold, "#efe6d8", "#8a3b32"] }) +
        tableRound({ top: "#f2efea", legs: gold }) +
        `<path d="M520 655Q600 640 680 655" stroke="#d9d4cc" stroke-width="2" fill="none"/>` +
        `<rect x="590" y="632" width="20" height="24" rx="6" fill="#ffffff"/><circle cx="600" cy="626" r="12" fill="#c45a6a"/>` +
        plant({ x: 262, pot: "#2d3e5c", leaves: ["#55804f", "#3f6a3c"] }) +
        // stolik boczny z lampą
        shadow(895, 640, 34, 7) +
        `<rect x="868" y="560" width="54" height="78" rx="4" fill="#5b3a26"/><rect x="862" y="552" width="66" height="10" rx="3" fill="#6f4a32"/>` +
        `<rect x="892" y="500" width="6" height="52" fill="${gold}"/><path d="M868 470h54l10 34h-74Z" fill="#f6efe1"/>`
      );
    },
  },
  boho: {
    room: { wallBack: "#f0e4d4", wallSide: "#e7d7c2", wallShade: "#d3c0a5", ceiling: "#f7efe4", floor: "#c49a6c", floorLine: "#a8805a", floorType: "planks", baseboard: "#f7efe4", windowFrame: "#fbf7f0" },
    furniture() {
      let macrame = `<line x1="540" y1="245" x2="660" y2="245" stroke="#8a5a3b" stroke-width="6" stroke-linecap="round"/>`;
      for (let i = 0; i < 9; i++) {
        const x = 552 + i * 12;
        macrame += `<path d="M${x} 247L${600 + (x - 600) * 0.35} 330L${600 + (x - 600) * 0.2} 380" stroke="#c9ab80" stroke-width="3" fill="none"/>`;
      }
      macrame += `<path d="M560 290L600 330L640 290" stroke="#b08d5c" stroke-width="5" fill="none"/>`;
      return (
        // okrągły dywan z juty
        `<ellipse cx="600" cy="690" rx="300" ry="80" fill="#cfae7d"/>` +
        `<ellipse cx="600" cy="690" rx="240" ry="62" fill="none" stroke="#b8935e" stroke-width="4"/>` +
        `<ellipse cx="600" cy="690" rx="170" ry="44" fill="none" stroke="#b8935e" stroke-width="4"/>` +
        `<ellipse cx="600" cy="690" rx="95" ry="25" fill="none" stroke="#b8935e" stroke-width="4"/>` +
        macrame +
        pendant({ kind: "rattan", col: "#d9b07a", y: 175 }) +
        sofa({ body: "#ede3d3", shade: "#dccfb9", legs: "#8a5a3b", cushions: ["#c0673f", "#d9a441", "#5f7a4a"] }) +
        tableRound({ cy: 672, rx: 80, top: "#8a5a3b", legs: "#6e4529" }) +
        `<rect x="585" y="650" width="16" height="22" rx="4" fill="#f0e4d4"/><path d="M593 650q-12-24 4-34q4 18-4 34" fill="#5f7a4a"/>` +
        // pufa
        shadow(830, 702, 50, 9) +
        `<ellipse cx="830" cy="690" rx="48" ry="14" fill="#a85633"/><rect x="782" y="660" width="96" height="30" fill="#c0673f"/><ellipse cx="830" cy="660" rx="48" ry="14" fill="#cf7a52"/>` +
        plant({ x: 255, pot: "#c0673f", leaves: ["#5f7a4a", "#4b6639"], tall: 1.15 }) +
        plant({ x: 900, base: 600, pot: "#e8d5b8", leaves: ["#6a8a52", "#55743f"], tall: 0.8 })
      );
    },
  },
  japandi: {
    room: { wallBack: "#ece6dc", wallSide: "#e0d8cb", wallShade: "#c9bfae", ceiling: "#f4efe7", floor: "#cbb08a", floorLine: "#ae9268", floorType: "planks", baseboard: "#f4efe7", windowFrame: "#5a4636" },
    furniture() {
      return (
        rugTrapezoid("#e9e2d6", "#b8b09c", false) +
        art({ x: 530, y: 250, w: 140, h: 140, frame: "#5a4636", bg: "#f7f3ea", inner: `<path d="M630 320a30 30 0 1 1 -10 -22" stroke="#2a2a2a" stroke-width="9" fill="none" stroke-linecap="round"/>` }) +
        pendant({ kind: "lantern", col: "#f7f3ea", y: 165 }) +
        sofa({ seatY: 545, backTop: 495, w: 460, body: "#bdb5a1", shade: "#a69e89", legs: "#5a4636", cushions: ["#7c8a6e", "#e9e2d6"] }) +
        tableRect({ y: 668, w: 300, top: "#5a4636", side: "#45352a", legs: "#45352a", low: true }) +
        `<rect x="545" y="655" width="22" height="18" rx="4" fill="#e9e2d6"/><path d="M640 670q-6-40 -26-60M640 670q4-34 22-50" stroke="#5a4636" stroke-width="3" fill="none"/><rect x="630" y="652" width="20" height="20" rx="3" fill="#7c8a6e"/>` +
        // lampa-kula na podłodze
        shadow(885, 640, 40, 8) +
        `<circle cx="885" cy="598" r="40" fill="#f7f3ea"/><path d="M848 586h74M846 600h78M850 614h70" stroke="#e1d7c4" stroke-width="2"/>` +
        plant({ x: 262, pot: "#5a4636", leaves: ["#7c8a6e", "#66745a"], tall: 0.9 })
      );
    },
  },
};

const TITLES = {
  skandynawski: "skandynawski",
  nowoczesny: "nowoczesny",
  loft: "loft",
  klasyczny: "klasyczny",
  boho: "boho",
  japandi: "japandi",
};

function svg(content, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" role="img" aria-label="${title}">
<title>${title}</title>
${content}
</svg>
`;
}

for (const [slug, cfg] of Object.entries(ROOMS)) {
  const c = { backFeature: "none", ...cfg.room };
  const base = room(c);
  const before = base + pendant({ kind: "bulb", y: 200 }) + outlet;
  const after = base + cfg.furniture() + watermark;
  writeFileSync(join(OUT, "portfolio", `${slug}-przed.svg`), svg(before, `Pusty pokój – zdjęcie przed (styl ${TITLES[slug]})`));
  writeFileSync(join(OUT, "portfolio", `${slug}-po.svg`), svg(after, `Pokój po wirtualnym home stagingu – styl ${TITLES[slug]} (wizualizacja)`));
}

// ---------- Salon demo: ten sam pokój w 6 stylach ----------
// Jedno pomieszczenie (ściany, okno, grzejnik, podłoga bez zmian), zmieniają się tylko meble i dodatki –
// tak jak w prawdziwej usłudze. Używane przez src/components/marketing/StyleSwitcher.tsx.
{
  const demoRoom = {
    backFeature: "none",
    wallBack: "#efebe4",
    wallSide: "#e4ded4",
    wallShade: "#d2cabd",
    ceiling: "#f7f5f1",
    floor: "#d4bb94",
    floorLine: "#b99e74",
    floorType: "planks",
    baseboard: "#fbfaf7",
    windowFrame: "#ffffff",
  };
  // Grzejnik pod oknem na lewej ścianie (element stały – zostaje na każdej wizualizacji).
  let radiator = poly(
    [
      [82, 560],
      [222, 507],
      [222, 588],
      [82, 694],
    ],
    `fill="#f8f7f3" stroke="#cfc8bc" stroke-width="2" stroke-linejoin="round"`,
  );
  for (let i = 1; i < 10; i++) {
    const x = 82 + i * 14;
    const yTop = 560 - (53 * (x - 82)) / 140;
    const yBot = 694 - (106 * (x - 82)) / 140;
    radiator += `<line x1="${x}" y1="${(yTop + 6).toFixed(1)}" x2="${x}" y2="${(yBot - 6).toFixed(1)}" stroke="#d9d3c8" stroke-width="2"/>`;
  }
  const base = room(demoRoom) + radiator;
  writeFileSync(
    join(OUT, "portfolio", "salon-demo-przed.svg"),
    svg(base + pendant({ kind: "bulb", y: 200 }) + outlet, "Pusty salon z oknem, grzejnikiem i drewnianą podłogą – zdjęcie przed"),
  );
  for (const [slug, cfg] of Object.entries(ROOMS)) {
    writeFileSync(
      join(OUT, "portfolio", `salon-demo-${slug}.svg`),
      svg(base + cfg.furniture() + watermark, `Ten sam salon urządzony w stylu ${TITLES[slug]} (wizualizacja)`),
    );
  }
}

// ---------- OpenGraph 1200×630 ----------
{
  const c = { backFeature: "none", ...ROOMS.skandynawski.room };
  const roomFull = room(c) + ROOMS.skandynawski.furniture();
  const roomEmpty = room(c) + pendant({ kind: "bulb", y: 200 }) + outlet;
  const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Wirtualny Staging – puste mieszkanie? Umeblujemy je w 24 h.">
<title>Wirtualny Staging – puste mieszkanie? Umeblujemy je w 24 h.</title>
<defs>
  <clipPath id="frame"><rect x="600" y="80" width="540" height="470" rx="20"/></clipPath>
  <clipPath id="half"><rect x="0" y="0" width="600" height="800"/></clipPath>
</defs>
<rect width="1200" height="630" fill="#faf8f5"/>
<rect x="0" y="0" width="560" height="630" fill="#1f4d3a"/>
<g transform="translate(64 92)">
  <path d="M4 14.5 16 4l12 10.5V27a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 4 27V14.5Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" transform="scale(1.6)"/>
  <rect x="9" y="17" width="14" height="5" rx="1.6" fill="#c9a87c" transform="scale(1.6)"/>
  <rect x="10.5" y="14" width="11" height="4.5" rx="1.6" fill="#fff" transform="scale(1.6)"/>
  <text x="66" y="34" font-family="${FONT}" font-size="30" font-weight="600" fill="#ffffff">Wirtualny Staging</text>
</g>
<text font-family="${FONT}" font-size="54" font-weight="700" fill="#ffffff" letter-spacing="-1">
  <tspan x="64" y="260">Puste mieszkanie?</tspan>
  <tspan x="64" y="326">Umeblujemy je</tspan>
  <tspan x="64" y="392" fill="#e2c9a3">w 24 h.</tspan>
</text>
<text font-family="${FONT}" font-size="22" fill="#ffffff" fill-opacity=".85">
  <tspan x="64" y="470">Wirtualny home staging dla nieruchomości</tspan>
  <tspan x="64" y="506">od 29 zł za zdjęcie · płatność BLIK</tspan>
</text>
<g clip-path="url(#frame)">
  <g transform="translate(517.5 80) scale(0.5875)">
    ${roomFull}
    <g clip-path="url(#half)">${roomEmpty}</g>
    <line x1="600" y1="0" x2="600" y2="800" stroke="#ffffff" stroke-width="6"/>
    <circle cx="600" cy="400" r="34" fill="#ffffff"/>
    <path d="M588 386l-14 14 14 14M612 386l14 14-14 14" stroke="#1f4d3a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</g>
<rect x="600" y="80" width="540" height="470" rx="20" fill="none" stroke="#e7e1d8" stroke-width="2"/>
<text x="1122" y="532" text-anchor="end" font-family="${FONT}" font-size="18" font-weight="600" letter-spacing="1" fill="#ffffff" fill-opacity=".8" stroke="#000" stroke-opacity=".28" stroke-width="1" paint-order="stroke">wizualizacja</text>
<rect x="620" y="100" width="76" height="30" rx="15" fill="#1c1c1e" fill-opacity=".75"/>
<text x="658" y="121" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="600" fill="#fff">Przed</text>
<rect x="1052" y="100" width="68" height="30" rx="15" fill="#1f4d3a"/>
<text x="1086" y="121" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="600" fill="#fff">Po</text>
</svg>
`;
  writeFileSync(join(OUT, "og.svg"), og);
  // PNG dla serwisów społecznościowych (Facebook/LinkedIn nie obsługują SVG w og:image).
  await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(join(OUT, "og.png"));
}

console.log("Wygenerowano ilustracje w", OUT);
