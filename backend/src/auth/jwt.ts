import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../models/User.js";

export interface AuthTokenPayload {
  sub: string;
  role: Role;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
