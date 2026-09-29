import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { buildApp } from "./app.js";
import { attachSocketServer } from "./sockets/index.js";

async function main() {
  const app = await buildApp();

  await connectDb();
  app.log.info("Connected to MongoDB");

  await app.listen({ port: env.port, host: "0.0.0.0" });
  attachSocketServer(app.server);
  app.log.info(`API listening on port ${env.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
