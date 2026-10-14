import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { StorageError, StorageNotFoundError, buildProxyUrl, createLocalStorage, sanitizeKey } from "@/lib/storage";
import type { Storage } from "@/lib/storage";

describe("sanitizeKey", () => {
  it("przepuszcza poprawne klucze", () => {
    expect(sanitizeKey("orders/abc/original/1.jpg")).toBe("orders/abc/original/1.jpg");
    expect(sanitizeKey("/tmp/x.png")).toBe("tmp/x.png");
  });
  it("blokuje path traversal i dziwne znaki", () => {
    for (const key of ["../x", "tmp/../../etc/passwd", "tmp//x", "tmp/.hidden", "a/b c", "", "tmp/x..y/..", "..\\x"]) {
      expect(() => sanitizeKey(key)).toThrow(StorageError);
    }
  });
});

describe("buildProxyUrl", () => {
  it("dokleja parametry", () => {
    expect(buildProxyUrl("orders/a/result/1.jpg", { token: "abc", width: 400 })).toBe(
      "/api/files/orders/a/result/1.jpg?token=abc&w=400",
    );
  });
});

describe("LocalStorage", () => {
  let dir: string;
  let storage: Storage;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "ws-storage-"));
    storage = createLocalStorage(dir);
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("zapisuje, czyta, listuje i usuwa", async () => {
    await storage.put("tmp/a.jpg", Buffer.from("abc"), "image/jpeg");
    await storage.put("orders/o1/original/1.jpg", Buffer.from("x"), "image/jpeg");
    expect((await storage.get("tmp/a.jpg")).toString()).toBe("abc");
    expect((await storage.list("tmp/")).map((f) => f.key)).toEqual(["tmp/a.jpg"]);
    expect((await storage.list("orders/o1/")).map((f) => f.key)).toEqual(["orders/o1/original/1.jpg"]);
    await storage.delete("tmp/a.jpg");
    await expect(storage.get("tmp/a.jpg")).rejects.toBeInstanceOf(StorageNotFoundError);
    expect(await storage.list("brak/")).toEqual([]);
  });

  it("nie pozwala wyjść poza katalog", async () => {
    await expect(storage.put("../escape.txt", Buffer.from("x"), "text/plain")).rejects.toBeInstanceOf(StorageError);
    expect(await readdir(path.dirname(dir))).not.toContain("escape.txt");
  });
});
