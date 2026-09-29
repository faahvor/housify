import "dotenv/config";
import path from "node:path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// The API is locked to port 4000 (the frontend is locked to 3001).
// scripts/ensure-port.cjs frees the port before startup; never fall back to another one.
const API_PORT = 4000;

if (process.env.PORT && Number(process.env.PORT) !== API_PORT) {
  throw new Error(`PORT is set to ${process.env.PORT}, but the API is locked to port ${API_PORT}.`);
}

export const env = {
  port: API_PORT,
  mongodbUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3001",
  /** Public base URL of this API, used to build links to uploaded files. */
  publicApiUrl: (process.env.PUBLIC_API_URL ?? `http://localhost:${API_PORT}`).replace(/\/$/, ""),
  /** Where the local storage driver keeps uploads. */
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads")),
  storage: storageConfig(),
};

/** "local" (default) keeps uploads on this server; "cloudinary" sends them to Cloudinary. */
function storageConfig() {
  const driver = (process.env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
  if (driver === "local") return { driver: "local" as const };
  if (driver !== "cloudinary") {
    throw new Error(`STORAGE_DRIVER must be "local" or "cloudinary" (got "${driver}").`);
  }
  const missing = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    throw new Error(`STORAGE_DRIVER=cloudinary but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set in backend/.env.`);
  }
  return {
    driver: "cloudinary" as const,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY!.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET!.trim(),
    /** Keeps this app's files together (and separate from other environments) in your Cloudinary account. */
    folder: (process.env.CLOUDINARY_FOLDER ?? "housify").trim().replace(/^\/+|\/+$/g, ""),
  };
}
