import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

/**
 * Where uploaded media lives. Pick the driver with STORAGE_DRIVER in backend/.env;
 * both implement the same methods, so the upload routes never change.
 */
export interface Storage {
  readonly name: "local" | "cloudinary";
  /** Stores bytes under `key` (e.g. "listing-photo/<owner>/<uuid>.webp") and returns a public URL. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  remove(key: string): Promise<void>;
  /** True when `url` points at a file this storage serves. */
  owns(url: string): boolean;
  /** Confirms the storage is reachable and the credentials work. */
  check(): Promise<void>;
}

/* ───────── Local disk (development default) ───────── */

class LocalDiskStorage implements Storage {
  readonly name = "local" as const;

  constructor(
    private readonly dir: string,
    private readonly publicBase: string
  ) {}

  async put(key: string, body: Buffer): Promise<string> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return `${this.publicBase}/${key}`;
  }

  async remove(key: string): Promise<void> {
    await unlink(this.resolve(key)).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
  }

  owns(url: string): boolean {
    return url.startsWith(`${this.publicBase}/`);
  }

  async check(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  /** Keys are generated server-side, but never let one escape the upload folder. */
  private resolve(key: string): string {
    const file = path.resolve(this.dir, key);
    if (!file.startsWith(path.resolve(this.dir) + path.sep)) throw new Error("Invalid storage key.");
    return file;
  }
}

/* ───────── Cloudinary ───────── */

type CloudinaryConfig = Extract<typeof env.storage, { driver: "cloudinary" }>;

class CloudinaryStorage implements Storage {
  readonly name = "cloudinary" as const;

  constructor(private readonly cfg: CloudinaryConfig) {
    cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret, secure: true });
  }

  /** "listing-photo/<owner>/<uuid>.webp" → "housify/listing-photo/<owner>/<uuid>" */
  private publicId(key: string) {
    return `${this.cfg.folder}/${key.replace(/\.[a-z0-9]+$/i, "")}`;
  }

  private resourceType(keyOrType: string): "image" | "video" {
    return /(^video\/|\.(mp4|mov|webm)$)/i.test(keyOrType) ? "video" : "image";
  }

  put(key: string, body: Buffer, contentType: string): Promise<string> {
    const resourceType = this.resourceType(contentType);
    const publicId = this.publicId(key);
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: resourceType, overwrite: false, unique_filename: false, timeout: 120_000 },
        (err, result) => {
          if (err || !result) return reject(new Error(`Cloudinary upload failed: ${err?.message ?? "no response"}`));
          if (resourceType === "image") return resolve(result.secure_url);
          // Videos are stored as uploaded; this URL asks Cloudinary to compress
          // (q_auto) and serve a widely supported MP4 when it's played.
          resolve(
            cloudinary.url(publicId, {
              resource_type: "video",
              secure: true,
              version: result.version,
              format: "mp4",
              transformation: [{ quality: "auto" }],
            })
          );
        }
      );
      stream.end(body);
    });
  }

  async remove(key: string): Promise<void> {
    const res = await cloudinary.uploader.destroy(this.publicId(key), { resource_type: this.resourceType(key), invalidate: true });
    if (res.result !== "ok" && res.result !== "not found") throw new Error(`Cloudinary delete failed: ${res.result}`);
  }

  owns(url: string): boolean {
    return url.startsWith(`https://res.cloudinary.com/${this.cfg.cloudName}/`);
  }

  async check(): Promise<void> {
    try {
      await cloudinary.api.ping();
    } catch (err) {
      const e = err as { error?: { message?: string; http_code?: number }; message?: string };
      const detail = e.error?.message ?? e.message ?? "unknown error";
      const hint = /cloud_name/i.test(detail)
        ? " CLOUDINARY_CLOUD_NAME doesn't match the account these API keys belong to — copy it from Settings → API Keys (the part after @ in CLOUDINARY_URL)."
        : e.error?.http_code === 401
          ? " Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
          : "";
      throw new Error(`Can't reach Cloudinary (${detail}).${hint}`);
    }
  }
}

export const storage: Storage =
  env.storage.driver === "cloudinary"
    ? new CloudinaryStorage(env.storage)
    : new LocalDiskStorage(env.uploadDir, `${env.publicApiUrl}/uploads`);
