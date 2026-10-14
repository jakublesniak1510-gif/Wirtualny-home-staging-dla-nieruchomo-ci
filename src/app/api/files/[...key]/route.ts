import { isAdminRequest } from "@/lib/admin-auth";
import { canAccessFile } from "@/lib/file-access";
import { makeThumbnail, pickThumbWidth } from "@/lib/images";
import { mimeForExtension } from "@/lib/orders";
import {
  StorageError,
  StorageNotFoundError,
  contentDisposition,
  getStorage,
  safeDownloadName,
  sanitizeKey,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/files/<klucz>?token=<publicToken>|sig=<podpis>&w=<szerokość>&download=<nazwa>
 * Dostęp: sesja admina, poprawny token zamówienia (plik musi należeć do zamówienia)
 * albo podpis pliku tymczasowego.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/files/[...key]">) {
  const { key: parts } = await ctx.params;
  let key: string;
  try {
    key = sanitizeKey(parts.map((part: string) => decodeURIComponent(part)).join("/"));
  } catch {
    return Response.json({ error: "Nieprawidłowa ścieżka pliku." }, { status: 400 });
  }
  const url = new URL(request.url);
  const allowed = await canAccessFile({
    key,
    isAdmin: isAdminRequest(request),
    token: url.searchParams.get("token"),
    sig: url.searchParams.get("sig"),
  });
  if (!allowed) return Response.json({ error: "Brak dostępu do pliku." }, { status: 403 });

  try {
    const original = await getStorage().get(key);
    const width = pickThumbWidth(url.searchParams.get("w"));
    const body = width ? await makeThumbnail(original, width) : original;
    const type = width ? "image/webp" : mimeForExtension(key.split(".").pop() ?? "");
    const download = url.searchParams.get("download");
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Content-Length": String(body.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    };
    if (download) {
      headers["Content-Disposition"] = contentDisposition("attachment", safeDownloadName(download, key));
    }
    return new Response(new Uint8Array(body), { headers });
  } catch (error) {
    if (error instanceof StorageNotFoundError) {
      return Response.json({ error: "Plik nie istnieje lub został już usunięty." }, { status: 404 });
    }
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("[files] Błąd odczytu:", error);
    return Response.json({ error: "Nie udało się odczytać pliku." }, { status: 500 });
  }
}
