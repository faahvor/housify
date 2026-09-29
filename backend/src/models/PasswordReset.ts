import { Schema, model } from "mongoose";

// One row per emailed reset link. Only a SHA-256 hash of the token is stored,
// so a database leak can't be turned into working reset links.
const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    requestIp: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB deletes rows a day after they expire.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const PasswordReset = model("PasswordReset", passwordResetSchema);
