// Imported first by e2e-smoke.ts so uploads made during tests go to a throwaway
// folder instead of the real uploads directory.
import os from "node:os";
import path from "node:path";

process.env.UPLOAD_DIR = path.join(os.tmpdir(), `housify-e2e-uploads-${process.pid}`);
// Tests never touch real cloud storage.
process.env.STORAGE_DRIVER = "local";
