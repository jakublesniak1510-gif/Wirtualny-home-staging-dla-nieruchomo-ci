import sharp from "sharp";

/**
 * Znak wodny „wizualizacja” nakładany automatycznie na każdy wynik wgrany przez operatora.
 * Półprzezroczysty biały tekst z cieniem w prawym dolnym rogu, wysokość ok. 2,5% szerokości.
 */

export const WATERMARK_TEXT = "wizualizacja";
/** Wielkość czcionki jako ułamek szerokości obrazu. */
export const WATERMARK_SIZE_RATIO = 0.025;

export interface WatermarkResult {
  buffer: Buffer;
  width: number;
  height: number;
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** SVG z napisem w rozmiarze całego obrazu (tekst wyrównany do prawego dolnego rogu). */
export function buildWatermarkSvg(width: number, height: number, rawText = WATERMARK_TEXT): string {
  const text = escapeXml(rawText);
  const fontSize = Math.max(14, Math.round(width * WATERMARK_SIZE_RATIO));
  const margin = Math.max(10, Math.round(width * 0.02));
  const shadow = Math.max(1, Math.round(fontSize / 14));
  const x = width - margin;
  const y = height - margin;
  const font = `font-family="Inter, 'DejaVu Sans', Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="end" letter-spacing="${(fontSize * 0.02).toFixed(2)}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="${x + shadow}" y="${y + shadow}" ${font} fill="#000000" fill-opacity="0.45">${text}</text>
  <text x="${x}" y="${y}" ${font} fill="#ffffff" fill-opacity="0.82">${text}</text>
</svg>`;
}

/**
 * Nakłada znak wodny. Zachowuje format wejściowy (JPEG/PNG/WebP), obraca wg EXIF
 * i usuwa metadane (m.in. lokalizację GPS).
 */
export async function applyWatermark(input: Buffer): Promise<WatermarkResult> {
  const oriented = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
  const { width, height, format } = oriented.info;
  const svg = Buffer.from(buildWatermarkSvg(width, height));
  const pipeline = sharp(oriented.data).composite([{ input: svg, top: 0, left: 0 }]);

  if (format === "png") {
    return { buffer: await pipeline.png().toBuffer(), width, height, mime: "image/png", ext: "png" };
  }
  if (format === "webp") {
    return {
      buffer: await pipeline.webp({ quality: 90 }).toBuffer(),
      width,
      height,
      mime: "image/webp",
      ext: "webp",
    };
  }
  return {
    buffer: await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
    width,
    height,
    mime: "image/jpeg",
    ext: "jpg",
  };
}
