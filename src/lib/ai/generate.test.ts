import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * publishVariant / processVariant na magazynie lokalnym w katalogu tymczasowym
 * i prostej atrapie Prismy w pamięci (tylko metody używane przez generate.ts i admin-results.ts).
 */

interface FakePhoto {
  id: string;
  orderId: string;
  sortOrder: number;
  originalKey: string;
  resultKey: string | null;
  resultUploadedAt: Date | null;
  width: number | null;
  height: number | null;
}
interface FakeOrder {
  id: string;
  status: string;
  filesDeletedAt: Date | null;
}
interface FakeVariant {
  id: string;
  photoId: string;
  status: string;
  provider: string;
  model: string;
  prompt: string;
  key: string | null;
  error: string | null;
  costCents: number | null;
  externalId: string | null;
  finishedAt: Date | null;
  createdAt: Date;
}
interface FakeResult {
  id: string;
  photoId: string;
  key: string;
  label: string | null;
  source: string;
  sortOrder: number;
}

const db = {
  orders: new Map<string, FakeOrder>(),
  photos: new Map<string, FakePhoto>(),
  variants: new Map<string, FakeVariant>(),
  results: [] as FakeResult[],
};

const hoisted = vi.hoisted(() => ({ root: { dir: "" }, notify: vi.fn(async () => undefined) }));

vi.mock("@/lib/admin-notify", () => ({
  notifyOrderInProgressSafe: hoisted.notify,
  notifyRevisionResolvedSafe: vi.fn(async () => undefined),
}));

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

vi.mock("@/lib/db", () => {
  const withPhoto = (variant: FakeVariant) => {
    const photo = db.photos.get(variant.photoId);
    if (!photo) return null;
    const order = db.orders.get(photo.orderId);
    return { ...variant, photo: { ...photo, order } };
  };
  const prisma = {
    aiVariant: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const variant = db.variants.get(where.id);
        return variant ? withPhoto(variant) : null;
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const variant = db.variants.get(where.id);
        if (!variant) throw new Error("not found");
        return withPhoto(variant);
      },
      updateMany: async ({ where, data }: { where: { id: string; status: string }; data: Partial<FakeVariant> }) => {
        const variant = db.variants.get(where.id);
        if (!variant || variant.status !== where.status) return { count: 0 };
        Object.assign(variant, data);
        return { count: 1 };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<FakeVariant> }) => {
        const variant = db.variants.get(where.id);
        if (!variant) throw new Error("not found");
        Object.assign(variant, data);
        return variant;
      },
    },
    photo: {
      update: async ({ where, data }: { where: { id: string }; data: Partial<FakePhoto> }) => {
        const photo = db.photos.get(where.id);
        if (!photo) throw new Error("not found");
        Object.assign(photo, data);
        return photo;
      },
    },
    photoResult: {
      count: async ({ where }: { where: { photoId: string } }) => db.results.filter((r) => r.photoId === where.photoId).length,
      create: async ({ data }: { data: Omit<FakeResult, "id"> }) => {
        const created = { id: `res${db.results.length + 1}`, ...data };
        db.results.push(created);
        return created;
      },
    },
    order: {
      updateMany: async ({ where, data }: { where: { id: string; status: string }; data: { status: string } }) => {
        const order = db.orders.get(where.id);
        if (!order || order.status !== where.status) return { count: 0 };
        order.status = data.status;
        return { count: 1 };
      },
    },
  };
  return { prisma, default: prisma };
});

const { processVariant, publishVariant, AiGenerationError } = await import("@/lib/ai/generate");
const { getStorage } = await import("@/lib/storage");

async function roomJpeg(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: "#e8e2d8" } }).jpeg().toBuffer();
}

beforeAll(async () => {
  hoisted.root.dir = await mkdtemp(path.join(tmpdir(), "ws-ai-test-"));
});

afterAll(async () => {
  await rm(hoisted.root.dir, { recursive: true, force: true });
});

beforeEach(async () => {
  db.orders.clear();
  db.photos.clear();
  db.variants.clear();
  db.results.length = 0;
  hoisted.notify.mockClear();
  delete process.env.AI_MOCK_ENABLED;
  process.env.AI_PROVIDER = "mock";
  db.orders.set("o1", { id: "o1", status: "PAID", filesDeletedAt: null });
  db.photos.set("p1", {
    id: "p1",
    orderId: "o1",
    sortOrder: 0,
    originalKey: "orders/o1/original/1.jpg",
    resultKey: null,
    resultUploadedAt: null,
    width: 1200,
    height: 800,
  });
  await getStorage().put("orders/o1/original/1.jpg", await roomJpeg(1200, 800), "image/jpeg");
});

function addVariant(id: string, patch: Partial<FakeVariant> = {}): FakeVariant {
  const variant: FakeVariant = {
    id,
    photoId: "p1",
    status: "PENDING",
    provider: "mock",
    model: "mock-rectangle",
    prompt: "stage",
    key: null,
    error: null,
    costCents: null,
    externalId: null,
    finishedAt: null,
    createdAt: new Date(),
    ...patch,
  };
  db.variants.set(id, variant);
  return variant;
}

describe("processVariant", () => {
  it("generuje wariant mockiem i zapisuje BEZ znaku wodnego pod orders/<id>/ai/<variantId>.jpg", async () => {
    addVariant("v1");
    await processVariant("v1");
    const variant = db.variants.get("v1");
    expect(variant?.status).toBe("DONE");
    expect(variant?.key).toBe("orders/o1/ai/v1.jpg");
    const meta = await sharp(await getStorage().get("orders/o1/ai/v1.jpg")).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(800);
  }, 10_000);

  it("brak skonfigurowanego dostawcy → FAILED z komunikatem PL", async () => {
    addVariant("v2", { provider: "openai" });
    delete process.env.OPENAI_API_KEY;
    await processVariant("v2");
    expect(db.variants.get("v2")?.status).toBe("FAILED");
    expect(db.variants.get("v2")?.error).toMatch(/skonfiguruj klucz API w \.env/);
  });

  it("nie przetwarza wariantu, który nie jest PENDING", async () => {
    addVariant("v3", { status: "DONE", key: "x" });
    await processVariant("v3");
    expect(db.variants.get("v3")?.key).toBe("x");
  });
});

describe("publishVariant", () => {
  async function readyVariant(id: string) {
    const image = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#777777" } }).jpeg().toBuffer();
    await getStorage().put(`orders/o1/ai/${id}.jpg`, image, "image/jpeg");
    addVariant(id, { status: "DONE", key: `orders/o1/ai/${id}.jpg` });
    return image;
  }

  it("jako wynik główny: znak wodny, Photo.resultKey, PAID → IN_PROGRESS + powiadomienie", async () => {
    const image = await readyVariant("v10");
    const saved = await publishVariant("v10", { asPrimary: true });
    const photo = db.photos.get("p1");
    expect(photo?.resultKey).toBe(saved.key);
    expect(saved.key).toMatch(/^orders\/o1\/result\/1-\d+\.jpg$/);
    expect(db.orders.get("o1")?.status).toBe("IN_PROGRESS");
    expect(hoisted.notify).toHaveBeenCalledWith("o1");

    const stored = await getStorage().get(saved.key);
    const region = { left: 1200 - 300, top: 800 - 80, width: 300, height: 80 };
    const before = await sharp(image).extract(region).raw().toBuffer();
    const after = await sharp(stored).extract(region).raw().toBuffer();
    expect(after.equals(before)).toBe(false);
    // oryginalny wariant AI zostaje bez zmian (bez znaku wodnego)
    expect((await getStorage().get("orders/o1/ai/v10.jpg")).equals(image)).toBe(true);
  });

  it("drugi wynik główny podmienia plik; status zmienia się tylko raz", async () => {
    await readyVariant("v11");
    await readyVariant("v12");
    const first = await publishVariant("v11", { asPrimary: true });
    const second = await publishVariant("v12", { asPrimary: true });
    expect(db.photos.get("p1")?.resultKey).toBe(second.key);
    await expect(getStorage().get(first.key)).rejects.toThrow(/Nie znaleziono/);
    expect(hoisted.notify).toHaveBeenCalledTimes(1);
  });

  it("jako wariant dla klienta: PhotoResult z etykietą i source ai", async () => {
    await readyVariant("v13");
    const saved = await publishVariant("v13", { asPrimary: false, label: "  Wariant   B  " });
    expect(saved.photoResultId).toBeDefined();
    expect(db.results).toHaveLength(1);
    expect(db.results[0]).toMatchObject({ photoId: "p1", label: "Wariant B", source: "ai", sortOrder: 0, key: saved.key });
    expect(db.photos.get("p1")?.resultKey).toBeNull();
  });

  it("odrzuca niegotowy wariant i anulowane zamówienie", async () => {
    addVariant("v14", { status: "RUNNING" });
    await expect(publishVariant("v14", { asPrimary: true })).rejects.toBeInstanceOf(AiGenerationError);
    await readyVariant("v15");
    db.orders.set("o1", { id: "o1", status: "CANCELLED", filesDeletedAt: null });
    await expect(publishVariant("v15", { asPrimary: true })).rejects.toThrow(/anulowane/);
  });
});
