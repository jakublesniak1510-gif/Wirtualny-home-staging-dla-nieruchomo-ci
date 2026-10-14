import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { applyWatermark, buildWatermarkSvg } from "@/lib/watermark";

async function grayPng(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 120, g: 120, b: 120 } } })
    .png()
    .toBuffer();
}

describe("buildWatermarkSvg", () => {
  it("rozmiar czcionki ok. 2,5% szerokości", () => {
    expect(buildWatermarkSvg(2000, 1000)).toContain('font-size="50"');
    expect(buildWatermarkSvg(200, 100)).toContain('font-size="14"');
    expect(buildWatermarkSvg(2000, 1000)).toContain(">wizualizacja<");
  });

  it("escapuje tekst (brak wstrzyknięcia znaczników do SVG)", () => {
    const svg = buildWatermarkSvg(800, 600, `a<script>"&'</text><image href="x"/>`);
    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain("<image");
    expect(svg).toContain("a&lt;script&gt;&quot;&amp;&apos;&lt;/text&gt;");
  });
});

describe("applyWatermark", () => {
  it("zachowuje wymiary i format, zmienia prawy dolny róg, nie rusza lewego górnego", async () => {
    const width = 1600;
    const height = 1000;
    const input = await grayPng(width, height);
    const result = await applyWatermark(input);

    expect(result.mime).toBe("image/png");
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(width);
    expect(meta.height).toBe(height);

    const before = await sharp(input).raw().toBuffer();
    const after = await sharp(result.buffer).removeAlpha().raw().toBuffer();
    expect(after.equals(before)).toBe(false);

    const region = { left: width - 400, top: height - 120, width: 400, height: 120 };
    const cornerBefore = await sharp(input).extract(region).raw().toBuffer();
    const cornerAfter = await sharp(result.buffer).removeAlpha().extract(region).raw().toBuffer();
    expect(cornerAfter.equals(cornerBefore)).toBe(false);

    const topLeft = { left: 0, top: 0, width: 400, height: 300 };
    const tlBefore = await sharp(input).extract(topLeft).raw().toBuffer();
    const tlAfter = await sharp(result.buffer).removeAlpha().extract(topLeft).raw().toBuffer();
    expect(tlAfter.equals(tlBefore)).toBe(true);
  });

  it("dla JPEG zwraca JPEG", async () => {
    const jpeg = await sharp({ create: { width: 1000, height: 800, channels: 3, background: "#ddd" } })
      .jpeg()
      .toBuffer();
    const result = await applyWatermark(jpeg);
    expect(result.mime).toBe("image/jpeg");
    expect((await sharp(result.buffer).metadata()).format).toBe("jpeg");
  });
});
