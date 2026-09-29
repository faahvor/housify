import { Schema, model, type InferSchemaType } from "mongoose";

export const ROLES = ["user", "landlord", "agent", "realtor", "admin"] as const;
export type Role = (typeof ROLES)[number];
/** Roles people can pick when signing up. Admins are only created by the seed script. */
export const PUBLIC_ROLES = ["user", "landlord", "agent", "realtor"] as const;
export type PublicRole = (typeof PUBLIC_ROLES)[number];
/** Roles that can own listings. */
export const LISTING_ROLES = ["landlord", "agent", "realtor"] as const;

export const ACCOUNT_STATUSES = ["active", "suspended", "deactivated"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

const userSchema = new Schema(
  {
    role: { type: String, enum: ROLES, required: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: function (this: { role: string }) {
        return this.role !== "admin";
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    phone: {
      type: String,
      // Professionals must be reachable by phone; renters/buyers can add it later.
      required: function (this: { role: string }) {
        return this.role !== "admin" && this.role !== "user";
      },
    },
    whatsapp: { type: String },
    bio: { type: String },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ACCOUNT_STATUSES, default: "active", index: true },
    statusReason: { type: String },
    statusChangedAt: { type: Date },
    // Bumped on password reset/change; tokens carrying an older version stop working.
    tokenVersion: { type: Number, default: 0 },
    avatarUrl: { type: String },
    states: { type: [String], default: undefined },
    areasCovered: { type: [String], default: undefined },
    // Agent/realtor field
    experience: { type: String },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
