import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { buildApp } from "./app.js";
import { attachSocketServer } from "./sockets/index.js";
import { storage } from "./storage/index.js";

async function main() {
  const app = await buildApp();

  await connectDb();
  app.log.info("Connected to MongoDB");

  try {
    await storage.check();
    app.log.info(`Media storage: ${storage.name} (ready)`);
  } catch (err) {
    // Keep the rest of the API up, but make the problem impossible to miss.
    app.log.error(`Media storage (${storage.name}) is NOT working — uploads will fail: ${(err as Error).message}`);
  }

  await app.listen({ port: env.port, host: "0.0.0.0" });
  attachSocketServer(app.server);
  app.log.info(`API listening on port ${env.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
