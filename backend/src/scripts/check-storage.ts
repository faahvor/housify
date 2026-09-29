/**
 * End-to-end check of the configured media storage (STORAGE_DRIVER in backend/.env):
 * uploads a tiny generated test image, downloads it back, then deletes it.
 *
 *   npm run check:storage -w backend
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { storage } from "../storage/index.js";

async function main() {
  console.log(`Storage driver: ${storage.name}`);

  await storage.check();
  console.log("✓ Credentials accepted");

  const image = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#4f46e5" } }).webp().toBuffer();
  const key = `storage-check/${randomUUID()}.webp`;
  const url = await storage.put(key, image, "image/webp");
  console.log(`✓ Uploaded test image`);
  console.log(`  ${url}`);

  if (storage.name === "cloudinary") {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Uploaded, but the public URL returned HTTP ${res.status}.`);
    console.log(`✓ Public URL serves it (HTTP ${res.status}, ${res.headers.get("content-type")})`);
  }
  if (!storage.owns(url)) throw new Error("The storage doesn't recognise its own URL.");

  await storage.remove(key);
  console.log("✓ Deleted test image");
  console.log("\nMedia storage is working.");
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
