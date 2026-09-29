import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { User } from "../models/User.js";

// Credentials come from the environment so they never live in the repo:
//   ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:admin -w backend
async function main() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD (e.g. in backend/.env) before running this script.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  await connectDb();

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.findOneAndUpdate(
    { username },
    { role: "admin", name: process.env.ADMIN_NAME?.trim() || username, username, passwordHash, verified: true, status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin user ready: ${admin.username} (${admin._id})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
