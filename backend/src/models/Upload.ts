import { Schema, model, type InferSchemaType } from "mongoose";

export const UPLOAD_KINDS = ["listing-photo", "listing-video", "avatar"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

// One row per stored file: used for per-account quotas, ownership checks on
// delete, and cleaning up files that never ended up on a listing or profile.
const uploadSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: UPLOAD_KINDS, required: true },
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true, index: true },
    contentType: { type: String, required: true },
    bytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type UploadDoc = InferSchemaType<typeof uploadSchema>;
export const Upload = model("Upload", uploadSchema);
