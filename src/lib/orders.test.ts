import { describe, expect, it } from "vitest";
import {
  downloadFileName,
  extensionForMime,
  generatePackageCode,
  generatePublicToken,
  getDeadline,
  getOrderNumber,
  isOverdue,
  parseAddons,
  parseOrderNumber,
} from "@/lib/orders";
import { SITE } from "@/lib/site";

const created = new Date("2026-10-14T10:00:00Z");

describe("getOrderNumber / parseOrderNumber", () => {
  it("tworzy numer z 8 ostatnich znaków id", () => {
    expect(getOrderNumber("cmgq1x2y30000abcd1234wxyz")).toBe("WS-1234WXYZ");
  });
  it("odwraca numer na końcówkę id", () => {
    expect(parseOrderNumber("WS-1234WXYZ")).toBe("1234wxyz");
    expect(parseOrderNumber("ws1234wxyz")).toBe("1234wxyz");
    expect(parseOrderNumber("agent@biuro.pl")).toBeNull();
  });
});

describe("getDeadline", () => {
  it("standard: +24 h od opłacenia (lub złożenia)", () => {
    expect(getDeadline({ createdAt: created, express: false }).toISOString()).toBe(
      new Date(created.getTime() + SITE.turnaroundHours * 3_600_000).toISOString(),
    );
    const paidAt = new Date("2026-10-14T12:00:00Z");
    expect(getDeadline({ createdAt: created, paidAt, express: false }).toISOString()).toBe("2026-10-15T12:00:00.000Z");
  });
  it("ekspres: +6 h, próbka: +48 h", () => {
    expect(getDeadline({ createdAt: created, express: true }).toISOString()).toBe("2026-10-14T16:00:00.000Z");
    expect(getDeadline({ createdAt: created, express: false, isSample: true }).toISOString()).toBe(
      "2026-10-16T10:00:00.000Z",
    );
  });
});

describe("isOverdue", () => {
  const later = new Date("2026-10-16T00:00:00Z");
  it("tylko dla opłaconych / w realizacji po terminie", () => {
    expect(isOverdue({ createdAt: created, express: false, status: "PAID" }, later)).toBe(true);
    expect(isOverdue({ createdAt: created, express: false, status: "IN_PROGRESS" }, later)).toBe(true);
    expect(isOverdue({ createdAt: created, express: false, status: "DELIVERED" }, later)).toBe(false);
    expect(isOverdue({ createdAt: created, express: false, status: "NEW" }, later)).toBe(false);
    expect(isOverdue({ createdAt: created, express: false, status: "PAID" }, created)).toBe(false);
  });
});

describe("generatory", () => {
  it("token jest długi i URL-safe", () => {
    const token = generatePublicToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(generatePublicToken()).not.toBe(token);
  });
  it("kod pakietu w formacie WS-XXXX-XXXX bez mylących znaków", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generatePackageCode()).toMatch(/^WS-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    }
  });
});

describe("helpery plików", () => {
  it("parseAddons ignoruje śmieci", () => {
    expect(parseAddons('["noc-dzien","xxx"]')).toEqual(["noc-dzien"]);
    expect(parseAddons("nie-json")).toEqual([]);
  });
  it("rozszerzenia i nazwy plików", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/gif")).toBeNull();
    expect(downloadFileName("WS-ABCD1234", 2, "wizualizacja", "orders/x/result/3-1.png")).toBe(
      "WS-ABCD1234-03-wizualizacja.png",
    );
  });
});
