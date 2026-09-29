import "dotenv/config";

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
};
