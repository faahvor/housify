import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    role: { type: String, enum: ["landlord", "agent"], required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    bio: { type: String },
    verified: { type: Boolean, default: false },
    avatarUrl: { type: String },
    // Agent-only fields
    areasCovered: { type: [String], default: undefined },
    experience: { type: String },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
