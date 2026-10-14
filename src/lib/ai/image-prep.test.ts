import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MAX_INPUT_BYTES, fitToOriginal, prepareAiInput } from "@/lib/ai/image-prep";

describe("image-prep", () => {
  it("zmniejsza wejście do AI_MAX_INPUT_SIDE i zapisuje JPEG < 1 MB", async () => {
    const noise = Buffer.alloc(3000 * 2000 * 3);
    for (let i = 0; i < noise.length; i += 1) noise[i] = (i * 2654435761) % 256;
    const input = await sharp(noise, { raw: { width: 3000, height: 2000, channels: 3 } }).png().toBuffer();
    const prepared = await prepareAiInput(input, 2048);
    expect(Math.max(prepared.width, prepared.height)).toBeLessThanOrEqual(2048);
    expect(prepared.width / prepared.height).toBeCloseTo(1.5, 1);
    expect(prepared.buffer.length).toBeLessThanOrEqual(MAX_INPUT_BYTES);
    expect((await sharp(prepared.buffer).metadata()).format).toBe("jpeg");
  }, 20_000);

  it("dopasowuje wynik o innych proporcjach do proporcji oryginału", async () => {
    const output = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#888" } }).png().toBuffer();
    const fitted = await fitToOriginal(output, { width: 4000, height: 3000 });
    expect(fitted.width).toBe(1536);
    expect(fitted.height).toBe(1152);
    const meta = await sharp(fitted.buffer).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([1536, 1152, "jpeg"]);
  });
});
