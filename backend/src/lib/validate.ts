import { isValidObjectId } from "mongoose";
import { storage } from "../storage/index.js";

/** Thrown by the helpers below; the error handler turns it into a 400. */
export class ValidationError extends Error {
  statusCode = 400;
}

function fail(message: string): never {
  throw new ValidationError(message);
}

export function str(value: unknown, field: string, opts: { required?: boolean; max?: number; min?: number } = {}): string | undefined {
  const { required = false, max = 500, min = 0 } = opts;
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== "string") fail(`${field} must be text.`);
  const trimmed = value.trim();
  if (required && !trimmed) fail(`${field} is required.`);
  if (trimmed.length < min) fail(`${field} must be at least ${min} characters.`);
  if (trimmed.length > max) fail(`${field} must be ${max} characters or fewer.`);
  return trimmed;
}

export function requiredStr(value: unknown, field: string, max = 500): string {
  return str(value, field, { required: true, max })!;
}

export function email(value: unknown, field = "Email", required = true): string | undefined {
  const v = str(value, field, { required, max: 254 });
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail(`${field} doesn't look like a valid email address.`);
  return v?.toLowerCase();
}

export function num(value: unknown, field: string, opts: { min?: number; max?: number; required?: boolean } = {}): number | undefined {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, required = false } = opts;
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required.`);
    return undefined;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) fail(`${field} must be a number.`);
  if (n < min || n > max) fail(`${field} must be between ${min} and ${max}.`);
  return n;
}

export function bool(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return value === true || value === "true";
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string, required = true): T | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required.`);
    return undefined;
  }
  if (!allowed.includes(value as T)) fail(`${field} must be one of: ${allowed.join(", ")}.`);
  return value as T;
}

export function strList(value: unknown, field: string, maxItems = 50, maxLen = 120): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) fail(`${field} must be a list.`);
  if (value.length > maxItems) fail(`${field} can have at most ${maxItems} items.`);
  return value.map((v, i) => requiredStr(v, `${field} item ${i + 1}`, maxLen));
}

/** https:// links, or files uploaded to Housify's own storage. */
export function urlList(value: unknown, field: string, maxItems = 30): string[] | undefined {
  const list = strList(value, field, maxItems, 2048);
  for (const u of list ?? []) {
    if (!storage.owns(u) && !/^https:\/\/\S+$/i.test(u)) fail(`${field} must contain https:// links or uploaded files.`);
  }
  return list;
}

export function objectId(value: unknown, field: string): string {
  if (typeof value !== "string" || !isValidObjectId(value)) fail(`${field} is not a valid id.`);
  return value;
}

export function optionalObjectId(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return objectId(value, field);
}

/** Escape user input for use inside a RegExp (search boxes). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
