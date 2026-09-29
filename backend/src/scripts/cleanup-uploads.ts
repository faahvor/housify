/**
 * Deletes uploaded files that ended up unused — e.g. photos added to a listing
 * that was never saved — once they're over a day old.
 *
 *   npm run cleanup:uploads -w backend            # dry run: lists what would go
 *   npm run cleanup:uploads -w backend -- --apply # actually delete
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { Upload } from "../models/Upload.js";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { storage } from "../storage/index.js";

const apply = process.argv.includes("--apply");
const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

async function main() {
  await connectDb();
  const candidates = await Upload.find({ createdAt: { $lt: cutoff } }).lean();
  let removed = 0;
  let freed = 0;

  for (const u of candidates) {
    const used =
      (await Listing.exists({ $or: [{ photos: u.url }, { videos: u.url }] })) || (await User.exists({ avatarUrl: u.url }));
    if (used) continue;
    console.log(`${apply ? "Deleting" : "Would delete"} ${u.key} (${Math.round(u.bytes / 1024)} KB)`);
    if (apply) {
      await storage.remove(u.key);
      await Upload.deleteOne({ _id: u._id });
    }
    removed++;
    freed += u.bytes;
  }

  console.log(`\n${removed} unused file(s), ${(freed / 1024 / 1024).toFixed(1)} MB${apply ? " freed" : " — run with --apply to delete"}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
