import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

const { BodyTooLargeError, readBodyLimited, readFormDataLimited } = await import("@/lib/http-body");
const { readJson } = await import("@/lib/api");

/** Żądanie ze strumieniem bez Content-Length (jak Transfer-Encoding: chunked). */
function chunkedRequest(chunks: number, chunkSize: number, headers: Record<string, string> = {}): {
  request: Request;
  pulled: () => number;
} {
  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= chunks) {
        controller.close();
        return;
      }
      sent += 1;
      controller.enqueue(new Uint8Array(chunkSize).fill(97));
    },
  });
  const request = new Request("http://localhost/api/upload", {
    method: "POST",
    body: stream,
    headers,
    duplex: "half",
  } as RequestInit);
  return { request, pulled: () => sent };
}

describe("readBodyLimited", () => {
  it("przerywa odczyt strumienia bez Content-Length po przekroczeniu limitu", async () => {
    const { request, pulled } = chunkedRequest(1000, 1024);
    expect(request.headers.get("content-length")).toBeNull();
    await expect(readBodyLimited(request, 10 * 1024)).rejects.toBeInstanceOf(BodyTooLargeError);
    // nie wczytaliśmy całego 1 MB – tylko trochę ponad limit
    expect(pulled()).toBeLessThan(20);
  });

  it("odrzuca zadeklarowany za duży Content-Length bez czytania", async () => {
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: "abc",
      headers: { "content-length": "999999" },
    });
    await expect(readBodyLimited(request, 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("zwraca całe body mieszczące się w limicie", async () => {
    const { request } = chunkedRequest(3, 10);
    const body = await readBodyLimited(request, 100);
    expect(body.length).toBe(30);
  });

  it("readFormDataLimited parsuje multipart", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(50)], "a.jpg", { type: "image/jpeg" }));
    const request = new Request("http://localhost/api/upload", { method: "POST", body: form });
    const parsed = await readFormDataLimited(request, 10_000);
    const file = parsed.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).size).toBe(50);
    expect((file as File).name).toBe("a.jpg");
  });
});

describe("readJson z limitem", () => {
  it("parsuje poprawny JSON", async () => {
    const request = new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(await readJson(request)).toEqual({ a: 1 });
  });

  it("zwraca null dla body większego niż limit (także bez Content-Length)", async () => {
    const { request } = chunkedRequest(400, 1024, { "content-type": "application/json" });
    expect(await readJson(request)).toBeNull();
  });

  it("zwraca null dla niepoprawnego JSON", async () => {
    const request = new Request("http://localhost/x", { method: "POST", body: "{" });
    expect(await readJson(request)).toBeNull();
  });
});

describe("POST /api/upload – limit rozmiaru bez Content-Length", () => {
  it("strumień większy niż MAX_UPLOAD_MB → 413, bez wczytywania całości", async () => {
    vi.stubEnv("MAX_UPLOAD_MB", "0.01"); // ~10 KB (+64 KB zapasu na multipart)
    try {
      const { POST } = await import("@/app/api/upload/route");
      const { request, pulled } = chunkedRequest(5000, 1024, {
        "content-type": "multipart/form-data; boundary=x",
        "x-forwarded-for": "10.9.9.9",
      });
      const response = await POST(request);
      expect(response.status).toBe(413);
      expect(pulled()).toBeLessThan(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
