import { describe, expect, it } from "vitest";
import { ADDON_PROMPTS, HONESTY_CONSTRAINTS, buildStagingPrompt } from "@/lib/ai/prompt";
import { STYLES } from "@/lib/styles";

describe("buildStagingPrompt", () => {
  it("zawiera nazwę stylu, paletę i angielskie słowa kluczowe", () => {
    const prompt = buildStagingPrompt({ style: "skandynawski" });
    expect(prompt).toContain("Scandinavian");
    expect(prompt).toContain('"Skandynawski"');
    expect(prompt).toContain("light oak furniture");
    for (const color of STYLES[0].palette) expect(prompt).toContain(color);
  });

  it("dla każdego stylu zawiera jego nazwę z styles.ts", () => {
    for (const style of STYLES) {
      expect(buildStagingPrompt({ style: style.slug })).toContain(style.name);
    }
  });

  it("zawsze kończy się twardymi ograniczeniami uczciwości", () => {
    const prompt = buildStagingPrompt({ style: "loft", notes: "Proszę zasłonić pęknięcie na ścianie" });
    for (const rule of HONESTY_CONSTRAINTS) expect(prompt).toContain(rule);
    expect(prompt).toMatch(/keep walls, windows, doors, ceiling, room geometry, dimensions and camera perspective exactly as in the input/i);
    expect(prompt).toMatch(/do not add or remove windows or doors/i);
    expect(prompt).toMatch(/do not hide any defects \(cracks, stains, damp\)/i);
    expect(prompt).toMatch(/furniture scaled realistically to the room/i);
    const lastLine = prompt.split("\n").at(-1) ?? "";
    expect(lastLine).toContain("override everything above");
    expect(prompt.indexOf("Client notes")).toBeLessThan(prompt.indexOf("Strict rules"));
  });

  it("dodaje instrukcje dodatków", () => {
    const prompt = buildStagingPrompt({ style: "japandi", addons: ["usuniecie-mebli", "wirtualny-remont", "noc-dzien"] });
    expect(prompt).toContain("remove all existing furniture first".replace(/^r/, "R"));
    expect(prompt).toContain("Replace flooring with light oak, repaint walls in warm white");
    expect(prompt).toMatch(/convert to bright daylight/i);
    expect(prompt).toContain("Only surface finishes");
    expect(ADDON_PROMPTS["noc-dzien"]).toMatch(/daylight/);
  });

  it("bez dodatków nie zawiera ich instrukcji; nieznane dodatki pomija", () => {
    const prompt = buildStagingPrompt({ style: "boho", addons: ["nieznany"] });
    expect(prompt).not.toMatch(/remove all existing furniture/i);
    expect(prompt).not.toMatch(/repaint walls/i);
    expect(prompt).not.toMatch(/daylight/i);
  });

  it("uwzględnia uwagi klienta (skrócone) i rodzaj pomieszczenia", () => {
    const notes = `Sypialnia dla dziecka.\n\n${"x".repeat(1000)}`;
    const prompt = buildStagingPrompt({ style: "nowoczesny", notes, roomHint: "bedroom" });
    expect(prompt).toContain("empty bedroom");
    expect(prompt).toContain("Sypialnia dla dziecka.");
    expect(prompt).not.toContain("x".repeat(700));
  });

  it("nieznany styl – neutralny opis, ograniczenia nadal obecne", () => {
    const prompt = buildStagingPrompt({ style: "art-deco" });
    expect(prompt).toContain("art-deco");
    expect(prompt).toContain(HONESTY_CONSTRAINTS[0]);
  });
});
