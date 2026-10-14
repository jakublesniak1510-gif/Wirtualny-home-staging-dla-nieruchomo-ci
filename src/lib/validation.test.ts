import { describe, expect, it } from "vitest";
import {
  formatZodError,
  isValidNip,
  orderInputSchema,
  packageCodeCreateSchema,
  sampleInputSchema,
} from "@/lib/validation";

const TMP = "tmp/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
const TMP2 = "tmp/7c9e6679-7425-40de-944b-e07fc1f90ae7.png";
const CONSENTS = { terms: true, digital: true, honesty: true, rights: true };

function validOrder(overrides: Record<string, unknown> = {}) {
  return {
    photos: [{ tmpKey: TMP, name: "salon.jpg" }],
    style: "skandynawski",
    addons: ["noc-dzien"],
    express: false,
    email: "  Agent@Biuro.PL ",
    consents: CONSENTS,
    ...overrides,
  };
}

describe("isValidNip", () => {
  it("akceptuje poprawny NIP z myślnikami i prefiksem PL", () => {
    expect(isValidNip("5260250995")).toBe(true);
    expect(isValidNip("526-025-09-95")).toBe(true);
    expect(isValidNip("PL5260250995")).toBe(true);
  });
  it("odrzuca złą sumę kontrolną i złą długość", () => {
    expect(isValidNip("5260250994")).toBe(false);
    expect(isValidNip("123")).toBe(false);
    expect(isValidNip("abcdefghij")).toBe(false);
  });
});

describe("orderInputSchema", () => {
  it("parsuje poprawne zamówienie i normalizuje dane", () => {
    const result = orderInputSchema.parse(
      validOrder({ phone: "", nip: "526-025-09-95", packageCode: " ws-abcd-efgh ", notes: "  nie usuwaj kuchni " }),
    );
    expect(result.email).toBe("agent@biuro.pl");
    expect(result.phone).toBeUndefined();
    expect(result.nip).toBe("5260250995");
    expect(result.packageCode).toBe("WS-ABCD-EFGH");
    expect(result.notes).toBe("nie usuwaj kuchni");
    expect(result.addons).toEqual(["noc-dzien"]);
  });

  it("usuwa zduplikowane dodatki", () => {
    const result = orderInputSchema.parse(validOrder({ addons: ["noc-dzien", "noc-dzien"] }));
    expect(result.addons).toEqual(["noc-dzien"]);
  });

  it("wymaga wszystkich zgód", () => {
    const result = orderInputSchema.safeParse(validOrder({ consents: { ...CONSENTS, honesty: false } }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.fields["consents.honesty"]).toMatch(/uczciwego/);
    }
  });

  it("odrzuca nieznany styl, dodatek i błędny e-mail", () => {
    expect(orderInputSchema.safeParse(validOrder({ style: "barok" })).success).toBe(false);
    expect(orderInputSchema.safeParse(validOrder({ addons: ["basen"] })).success).toBe(false);
    const bad = orderInputSchema.safeParse(validOrder({ email: "nie-email" }));
    expect(bad.success).toBe(false);
    if (!bad.success) expect(formatZodError(bad.error).error).toBe("Podaj poprawny adres e-mail.");
  });

  it("pilnuje formatu kluczy tymczasowych (bez path traversal)", () => {
    for (const tmpKey of ["../etc/passwd", "orders/x/original/1.jpg", "tmp/../../x.jpg", "tmp/abc.jpg"]) {
      expect(orderInputSchema.safeParse(validOrder({ photos: [{ tmpKey }] })).success).toBe(false);
    }
  });

  it("limituje liczbę zdjęć i duplikaty", () => {
    expect(orderInputSchema.safeParse(validOrder({ photos: [] })).success).toBe(false);
    const dup = orderInputSchema.safeParse(validOrder({ photos: [{ tmpKey: TMP }, { tmpKey: TMP }] }));
    expect(dup.success).toBe(false);
    const ok = orderInputSchema.safeParse(validOrder({ photos: [{ tmpKey: TMP }, { tmpKey: TMP2 }] }));
    expect(ok.success).toBe(true);
    const many = Array.from({ length: 21 }, (_, i) => ({
      tmpKey: `tmp/0f8fad5b-d9cb-469f-a165-${String(i).padStart(12, "0")}.jpg`,
    }));
    expect(orderInputSchema.safeParse(validOrder({ photos: many })).success).toBe(false);
  });

  it("waliduje NIP i telefon", () => {
    expect(orderInputSchema.safeParse(validOrder({ nip: "1234567890" })).success).toBe(false);
    expect(orderInputSchema.safeParse(validOrder({ phone: "abc" })).success).toBe(false);
    expect(orderInputSchema.safeParse(validOrder({ phone: "+48 600 100 200" })).success).toBe(true);
  });
});

describe("sampleInputSchema", () => {
  it("wymaga telefonu i nazwy biura", () => {
    const base = { photo: { tmpKey: TMP }, style: "boho", email: "a@b.pl", consents: CONSENTS };
    expect(sampleInputSchema.safeParse(base).success).toBe(false);
    expect(
      sampleInputSchema.safeParse({ ...base, phone: "600100200", company: "Biuro Nieruchomości XYZ" }).success,
    ).toBe(true);
  });
});

describe("packageCodeCreateSchema", () => {
  it("parsuje kredyty i datę ważności", () => {
    const result = packageCodeCreateSchema.parse({ credits: "5", email: "", expiresAt: "2026-12-31" });
    expect(result.credits).toBe(5);
    expect(result.email).toBeUndefined();
    expect(result.expiresAt?.toISOString()).toBe("2026-12-31T23:59:59.999Z");
  });
  it("odrzuca zero kredytów i złą datę", () => {
    expect(packageCodeCreateSchema.safeParse({ credits: 0 }).success).toBe(false);
    expect(packageCodeCreateSchema.safeParse({ credits: 1, expiresAt: "31.12.2026" }).success).toBe(false);
  });
});
