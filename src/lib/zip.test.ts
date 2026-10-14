import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({ root: { dir: "" } }));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  let instance: ReturnType<typeof actual.createLocalStorage> | null = null;
  return {
    ...actual,
    getStorage: () => {
      if (!instance) instance = actual.createLocalStorage(hoisted.root.dir);
      return instance;
    },
  };
});

const { zipResponse } = await import("@/lib/zip");
const { getStorage } = await import("@/lib/storage");

/** Nazwy plików z centralnego katalogu ZIP (bez kompresji – wystarczy prosty parser). */
function zipEntryNames(zip: Buffer): string[] {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Brak końca archiwum (EOCD) – ZIP jest urwany.");
  const count = zip.readUInt16LE(eocd + 10);
  let offset = zip.readUInt32LE(eocd + 16);
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    names.push(zip.subarray(offset + 46, offset + 46 + nameLength).toString("utf8"));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

describe("zipResponse", () => {
  beforeAll(async () => {
    hoisted.root.dir = await mkdtemp(path.join(tmpdir(), "ws-zip-"));
    await getStorage().put("orders/o1/result/1.jpg", Buffer.from("JPEG-1"), "image/jpeg");
  });
  afterAll(async () => {
    await rm(hoisted.root.dir, { recursive: true, force: true });
  });

  it("brakujący plik w magazynie jest pomijany, a archiwum kompletne", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = zipResponse(
      [
        { name: "CZYTAJ.txt", content: "readme" },
        { key: "orders/o1/result/brak.jpg", name: "brak.jpg" },
        { key: "orders/o1/result/1.jpg", name: "jest.jpg" },
      ],
      "test.zip",
    );
    const zip = Buffer.from(await response.arrayBuffer());
    expect(zipEntryNames(zip)).toEqual(["CZYTAJ.txt", "jest.jpg"]);
  });
});
