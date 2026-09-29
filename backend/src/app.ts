import Fastify, { type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { ValidationError } from "./lib/validate.js";

/** Builds the API without listening, so scripts and tests can use `app.inject()`. */
export async function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify({ logger: true, ...options });

  await app.register(cors, { origin: env.webOrigin, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] });
  // Opt-in per route via `config.rateLimit`; everything else is unlimited.
  await app.register(rateLimit, { global: false });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ error: error.message });
    }
    const err = error as { statusCode?: number; message?: string; code?: string };
    if (err.statusCode === 429) {
      return reply.code(429).send({ error: "Too many attempts. Please wait a moment and try again." });
    }
    if (err.code === "FST_ERR_CTP_INVALID_JSON_BODY" || err.statusCode === 400) {
      return reply.code(400).send({ error: "The request was malformed." });
    }
    if (err.code === "11000" || (error as { code?: number }).code === 11000) {
      return reply.code(409).send({ error: "That already exists." });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Something went wrong on our side. Please try again." });
  });

  await registerRoutes(app);
  return app;
}
