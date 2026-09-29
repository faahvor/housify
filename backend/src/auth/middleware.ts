import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, type AuthTokenPayload } from "./jwt.js";
import { User, type Role } from "../models/User.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthTokenPayload;
  }
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

/**
 * Resolves the caller from their token AND the database, so role changes,
 * suspensions and deactivations apply immediately instead of when the JWT expires.
 */
async function resolveUser(token: string): Promise<AuthTokenPayload | { error: string; code: number }> {
  let payload: AuthTokenPayload;
  try {
    payload = verifyToken(token);
  } catch {
    return { error: "Your session has expired. Please sign in again.", code: 401 };
  }
  const user = await User.findById(payload.sub).select("role status").lean();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", code: 401 };
  }
  if (user.status === "suspended") {
    return { error: "This account has been suspended. Contact Housify support.", code: 403 };
  }
  if (user.status === "deactivated") {
    return { error: "This account has been deactivated.", code: 403 };
  }
  return { sub: payload.sub, role: user.role as Role };
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = bearerToken(request);
  if (!token) {
    return reply.code(401).send({ error: "Authentication required." });
  }
  const result = await resolveUser(token);
  if ("error" in result) {
    return reply.code(result.code).send({ error: result.error, code: result.code === 403 ? "ACCOUNT_BLOCKED" : undefined });
  }
  request.authUser = result;
}

/** Attaches the caller if a valid token is present, but never rejects. */
export async function optionalAuth(request: FastifyRequest): Promise<void> {
  const token = bearerToken(request);
  if (!token) return;
  const result = await resolveUser(token);
  if (!("error" in result)) request.authUser = result;
}

export function requireRole(...roles: Role[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;
    if (!roles.includes(request.authUser!.role)) {
      return reply.code(403).send({ error: "You don't have access to this." });
    }
  };
}

export const requireAdmin = requireRole("admin");
