import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { contentDisposition, getStorage } from "@/lib/storage";

/** Strumieniowa odpowiedź ZIP z plików z magazynu (zdjęcia są już skompresowane – bez kompresji). */

export interface ZipEntry {
  key: string;
  name: string;
}

export function zipResponse(entries: readonly ZipEntry[], filename: string): Response {
  const archive = new ZipArchive({ store: true });
  const storage = getStorage();

  void (async () => {
    try {
      for (const entry of entries) {
        archive.append(await storage.get(entry.key), { name: entry.name });
      }
      await archive.finalize();
    } catch (error) {
      console.error("[zip] Błąd tworzenia archiwum:", error);
      archive.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  const body = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>;
  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": contentDisposition("attachment", filename),
      "Cache-Control": "private, no-store",
    },
  });
}
