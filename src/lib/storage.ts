import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Magazyn plików (zdjęcia klientów, wyniki). Sterownik wybierany przez `STORAGE_DRIVER`:
 * - `local` (domyślnie) – katalog `./data/uploads` (lub `UPLOADS_DIR`),
 * - `s3` – dowolny magazyn zgodny z S3 (`S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, klucze).
 *
 * Klucze mają postać ścieżki z segmentami [A-Za-z0-9._-], np. `orders/<id>/original/1.jpg`.
 * Pliki NIE są publiczne – serwuje je `/api/files/[...key]` po autoryzacji.
 */

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(key: string) {
    super(`Nie znaleziono pliku: ${key}`);
    this.name = "StorageNotFoundError";
  }
}

export interface StoredObjectInfo {
  key: string;
  lastModified: Date;
  size: number;
}

export interface UrlOptions {
  /** Publiczny token zamówienia (autoryzacja klienta w /api/files). */
  token?: string;
  /** Wymuś pobranie (Content-Disposition: attachment) z podaną nazwą pliku. */
  downloadName?: string;
  /** Miniatura o danej szerokości (tylko przez /api/files). */
  width?: number;
}

export interface Storage {
  readonly driver: "local" | "s3";
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Lista obiektów pod prefiksem (np. `tmp/`). */
  list(prefix: string): Promise<StoredObjectInfo[]>;
  /**
   * Adres do pobrania pliku: dla `s3` podpisany URL (ważny 1 h), dla `local`
   * adres `/api/files/...` z tokenem. Wywołuj tylko po sprawdzeniu uprawnień.
   */
  getSignedOrProxyUrl(key: string, options?: UrlOptions): Promise<string>;
}

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const MAX_KEY_LENGTH = 512;

/** Sprawdza i normalizuje klucz – blokuje path traversal, puste segmenty i dziwne znaki. */
export function sanitizeKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.length === 0 || normalized.length > MAX_KEY_LENGTH) {
    throw new StorageError("Nieprawidłowy klucz pliku.");
  }
  const segments = normalized.split("/");
  for (const segment of segments) {
    if (!SEGMENT.test(segment) || segment === "." || segment === ".." || segment.includes("..")) {
      throw new StorageError("Nieprawidłowy klucz pliku.");
    }
  }
  return segments.join("/");
}

/** Prefiks (np. `tmp/`, `orders/abc/`) – te same reguły co klucz, ale dopuszczamy końcowy „/”. */
function sanitizePrefix(prefix: string): string {
  const trimmed = prefix.replace(/\/+$/, "");
  return trimmed.length === 0 ? "" : `${sanitizeKey(trimmed)}/`;
}

/** Adres pliku przez nasz proxy `/api/files/<key>` z parametrami autoryzacji. */
export function buildProxyUrl(key: string, options: UrlOptions & { sig?: string } = {}): string {
  const safeKey = sanitizeKey(key);
  const params = new URLSearchParams();
  if (options.token) params.set("token", options.token);
  if (options.sig) params.set("sig", options.sig);
  if (options.width) params.set("w", String(options.width));
  if (options.downloadName) params.set("download", options.downloadName);
  const query = params.toString();
  return `/api/files/${safeKey}${query ? `?${query}` : ""}`;
}

// --- local ---------------------------------------------------------------------

class LocalStorage implements Storage {
  readonly driver = "local" as const;
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    const safeKey = sanitizeKey(key);
    const full = path.resolve(this.root, ...safeKey.split("/"));
    if (!full.startsWith(this.root + path.sep)) {
      throw new StorageError("Nieprawidłowy klucz pliku.");
    }
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await readFile(this.resolve(key));
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") throw new StorageNotFoundError(key);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async list(prefix: string): Promise<StoredObjectInfo[]> {
    const safePrefix = sanitizePrefix(prefix);
    const base = safePrefix ? this.resolve(safePrefix.slice(0, -1)) : this.root;
    const result: StoredObjectInfo[] = [];
    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") return;
        throw error;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile()) {
          const info = await stat(full);
          result.push({
            key: path.relative(this.root, full).split(path.sep).join("/"),
            lastModified: info.mtime,
            size: info.size,
          });
        }
      }
    };
    await walk(base);
    return result;
  }

  async getSignedOrProxyUrl(key: string, options: UrlOptions = {}): Promise<string> {
    return buildProxyUrl(key, options);
  }
}

// --- s3 ------------------------------------------------------------------------

class S3Storage implements Storage {
  readonly driver = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const bucket = process.env.S3_BUCKET?.trim();
    if (!bucket) throw new StorageError("Brak S3_BUCKET – uzupełnij konfigurację magazynu S3.");
    this.bucket = bucket;
    const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
    this.client = new S3Client({
      region: process.env.S3_REGION?.trim() || "auto",
      endpoint,
      // MinIO i część dostawców wymaga adresów w stylu ścieżki.
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials:
        accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: sanitizeKey(key),
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: sanitizeKey(key) }),
      );
      if (!response.Body) throw new StorageNotFoundError(key);
      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) {
        throw new StorageNotFoundError(key);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: sanitizeKey(key) }));
  }

  async list(prefix: string): Promise<StoredObjectInfo[]> {
    const safePrefix = sanitizePrefix(prefix);
    const result: StoredObjectInfo[] = [];
    let continuationToken: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: safePrefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const item of page.Contents ?? []) {
        if (!item.Key) continue;
        result.push({
          key: item.Key,
          lastModified: item.LastModified ?? new Date(0),
          size: item.Size ?? 0,
        });
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
    return result;
  }

  async getSignedOrProxyUrl(key: string, options: UrlOptions = {}): Promise<string> {
    // Miniatury generujemy u siebie – wtedy zawsze przez proxy.
    if (options.width) return buildProxyUrl(key, options);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: sanitizeKey(key),
      ResponseContentDisposition: options.downloadName
        ? contentDisposition("attachment", options.downloadName)
        : undefined,
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }
}

// --- wspólne -------------------------------------------------------------------

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

/** Nagłówek Content-Disposition z nazwą pliku (ASCII + UTF-8). */
export function contentDisposition(type: "attachment" | "inline", filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Nazwa pobieranego pliku podana w adresie (`?download=`): bez separatorów ścieżki i znaków
 * sterujących, maks. 120 znaków i ZAWSZE z rozszerzeniem pliku z magazynu – link z cudzą nazwą
 * (np. `faktura.html`) nie zapisze obrazu jako pliku innego typu.
 */
export function safeDownloadName(raw: string, key: string): string {
  const base = key.split("/").pop() ?? "";
  const ext = base.includes(".") ? (base.split(".").pop() ?? "").toLowerCase() : "";
  let name = raw.replace(/[/\\]/g, "_").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 120);
  if (!name) name = base || "plik";
  if (ext && !name.toLowerCase().endsWith(`.${ext}`)) name = `${name}.${ext}`;
  return name;
}

let instance: Storage | undefined;

/** Leniwie tworzony magazyn (konfiguracja czytana przy pierwszym użyciu, nie w buildzie). */
export function getStorage(): Storage {
  if (!instance) {
    const driver = (process.env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
    if (driver === "s3") {
      instance = new S3Storage();
    } else if (driver === "local" || driver === "") {
      instance = new LocalStorage(process.env.UPLOADS_DIR?.trim() || "./data/uploads");
    } else {
      throw new StorageError(`Nieznany STORAGE_DRIVER: ${driver} (dozwolone: local, s3).`);
    }
  }
  return instance;
}

/** Tylko do testów: magazyn lokalny w podanym katalogu. */
export function createLocalStorage(root: string): Storage {
  return new LocalStorage(root);
}
