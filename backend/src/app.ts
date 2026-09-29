import Fastify, { type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { mkdirSync } from "node:fs";
import { MAX_UPLOAD_BYTES } from "./uploads/routes.js";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { ValidationError } from "./lib/validate.js";

/** Builds the API without listening, so scripts and tests can use `app.inject()`. */
export async function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify({ logger: true, ...options });

  await app.register(cors, { origin: env.webOrigin, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] });
  // Opt-in per route via `config.rateLimit`; everything else is unlimited.
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5 } });

  // Local storage driver: serve uploaded media. File names are random UUIDs and
  // never change, so they can be cached forever.
  mkdirSync(env.uploadDir, { recursive: true });
  await app.register(fastifyStatic, {
    root: env.uploadDir,
    prefix: "/uploads/",
    decorateReply: false,
    index: false,
    list: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ error: error.message });
    }
    const err = error as { statusCode?: number; message?: string; code?: string };
    if (err.statusCode === 413) {
      return reply.code(413).send({ error: "That file is too large." });
    }
    if (err.statusCode === 406 || err.code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
      return reply.code(400).send({ error: "Send the file as multipart/form-data." });
    }
    if (err.statusCode === 429) {
      return reply.code(429).send({ error: "Too many attempts. Please wait a moment and try again." });
    }
    if (err.code === "FST_ERR_CTP_INVALID_JSON_BODY" || err.statusCode === 400) {
      return reply.code(400).send({ error: "The request was malformed." });
    }
    if (err.code === "11000" || (error as { code?: number }).code === 11000) {
      return reply.code(409).send({ error: "That already exists." });
    }
    // Other client errors raised by plugins (e.g. the file server refusing a
    // directory or a "../" path) keep their status instead of becoming a 500.
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      const generic: Record<number, string> = { 401: "Authentication required.", 403: "Not allowed.", 404: "Not found." };
      return reply.code(err.statusCode).send({ error: generic[err.statusCode] ?? "The request couldn't be processed." });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Something went wrong on our side. Please try again." });
  });

  await registerRoutes(app);
  return app;
}
