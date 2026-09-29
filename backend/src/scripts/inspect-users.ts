import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { User } from "../models/User.js";
import { Listing } from "../models/Listing.js";

async function main() {
  await connectDb();

  const users = await User.find().lean();
  console.log(`Total users: ${users.length}`);
  for (const u of users) {
    console.log(`- role=${u.role} name="${u.name}" email=${u.email ?? "-"} username=${u.username ?? "-"} verified=${u.verified}`);
  }

  const listings = await Listing.countDocuments();
  console.log(`Total listings: ${listings}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
