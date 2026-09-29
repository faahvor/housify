import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { Types } from "mongoose";
import { Upload, UPLOAD_KINDS, type UploadKind } from "../models/Upload.js";
import { Listing } from "../models/Listing.js";
import { User, LISTING_ROLES, type Role } from "../models/User.js";
import { requireAuth } from "../auth/middleware.js";
import { objectId, oneOf } from "../lib/validate.js";
import { storage } from "../storage/index.js";

const MB = 1024 * 1024;
/** Hard cap on any single upload; per-kind limits are stricter. */
export const MAX_UPLOAD_BYTES = 60 * MB;
const LIMITS: Record<UploadKind, number> = {
  "listing-photo": 15 * MB,
  "listing-video": 60 * MB,
  avatar: 8 * MB,
};
/** Total storage each account may use. */
const QUOTA_BYTES = 1024 * MB;

const WHO_CAN_UPLOAD: Record<UploadKind, readonly Role[]> = {
  "listing-photo": LISTING_ROLES,
  "listing-video": LISTING_ROLES,
  avatar: ["user", "landlord", "agent", "realtor", "admin"],
};

const IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "heif", "avif", "gif", "tiff"]);

/** Identify a video by its leading bytes rather than trusting the filename or MIME type. */
function sniffVideo(buf: Buffer): { ext: string; contentType: string } | null {
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    return brand.startsWith("qt") ? { ext: "mov", contentType: "video/quicktime" } : { ext: "mp4", contentType: "video/mp4" };
  }
  if (buf.length >= 4 && buf.readUInt32BE(0) === 0x1a45dfa3) return { ext: "webm", contentType: "video/webm" };
  return null;
}

class UploadError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}

/** Decode, auto-rotate, strip metadata (including GPS) and re-encode as WebP. */
async function processImage(buf: Buffer, kind: UploadKind) {
  let meta: sharp.Metadata;
  try {
    meta = await sharp(buf, { limitInputPixels: 80_000_000 }).metadata();
  } catch {
    throw new UploadError("That file isn't an image we can read. Use a JPEG, PNG or WebP photo.");
  }
  if (!meta.format || !IMAGE_FORMATS.has(meta.format)) {
    throw new UploadError("Use a JPEG, PNG or WebP photo.");
  }
  try {
    // .rotate() applies the EXIF orientation; sharp drops all metadata unless asked to keep it.
    const pipeline = sharp(buf, { limitInputPixels: 80_000_000 }).rotate();
    const out =
      kind === "avatar"
        ? pipeline.resize(512, 512, { fit: "cover", position: "attention" })
        : pipeline.resize(2000, 2000, { fit: "inside", withoutEnlargement: true });
    const { data, info } = await out.webp({ quality: kind === "avatar" ? 82 : 80 }).toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, contentType: "image/webp", ext: "webp" };
  } catch {
    throw new UploadError(
      meta.format === "heif"
        ? "iPhone HEIC photos aren't supported yet. Choose “Most Compatible” in Camera settings, or export as JPEG."
        : "We couldn't process that photo. Try a different file."
    );
  }
}

export function toPublicUpload(u: any) {
  return { id: String(u._id), kind: u.kind, url: u.url, contentType: u.contentType, bytes: u.bytes, width: u.width ?? null, height: u.height ?? null };
}

export async function registerUploadRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/uploads",
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const me = request.authUser!;
      const kind = oneOf((request.query as { kind?: string }).kind, UPLOAD_KINDS, "Upload type")!;
      if (!WHO_CAN_UPLOAD[kind].includes(me.role)) {
        return reply.code(403).send({ error: "Only landlords, agents and realtors can upload listing media." });
      }
      if (!request.isMultipart()) return reply.code(400).send({ error: "Send the file as multipart/form-data." });

      const file = await request.file({ limits: { fileSize: LIMITS[kind], files: 1 } });
      if (!file) return reply.code(400).send({ error: "No file was attached." });
      let buf: Buffer;
      try {
        buf = await file.toBuffer();
      } catch {
        return reply.code(413).send({ error: `That file is too large. The limit is ${Math.round(LIMITS[kind] / MB)} MB.` });
      }
      if (buf.length === 0) return reply.code(400).send({ error: "The file is empty." });

      const used = await Upload.aggregate([{ $match: { ownerId: new Types.ObjectId(me.sub) } }, { $group: { _id: null, bytes: { $sum: "$bytes" } } }]);
      if ((used[0]?.bytes ?? 0) + buf.length > QUOTA_BYTES) {
        return reply.code(413).send({ error: "You've reached your storage limit. Remove some old photos or videos first." });
      }

      let stored: { data: Buffer; contentType: string; ext: string; width?: number; height?: number };
      try {
        if (kind === "listing-video") {
          const video = sniffVideo(buf);
          if (!video) throw new UploadError("Use an MP4, MOV or WebM video.");
          stored = { data: buf, ...video };
        } else {
          stored = await processImage(buf, kind);
        }
      } catch (err) {
        if (err instanceof UploadError) return reply.code(err.statusCode).send({ error: err.message });
        throw err;
      }

      const key = `${kind}/${me.sub}/${randomUUID()}.${stored.ext}`;
      const url = await storage.put(key, stored.data, stored.contentType);
      const doc = await Upload.create({
        ownerId: me.sub,
        kind,
        key,
        url,
        contentType: stored.contentType,
        bytes: stored.data.length,
        width: stored.width,
        height: stored.height,
      });
      return reply.code(201).send({ upload: toPublicUpload(doc) });
    }
  );

  app.delete("/uploads/:id", { preHandler: requireAuth }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Upload id");
    const doc = await Upload.findById(id);
    if (!doc) return reply.code(404).send({ error: "File not found." });
    if (String(doc.ownerId) !== request.authUser!.sub) return reply.code(403).send({ error: "That isn't your file." });

    const inUse =
      (await Listing.exists({ $or: [{ photos: doc.url }, { videos: doc.url }] })) || (await User.exists({ avatarUrl: doc.url }));
    if (inUse) return reply.code(409).send({ error: "This file is still used on a listing or profile. Remove it there first." });

    await storage.remove(doc.key);
    await doc.deleteOne();
    return { ok: true };
  });
}

/** True if `url` is a file the given person uploaded as `kind`. */
export async function isOwnUpload(url: string, ownerId: string, kind: UploadKind): Promise<boolean> {
  if (!storage.owns(url)) return false;
  return !!(await Upload.exists({ url, ownerId, kind }));
}
