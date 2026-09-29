import { Schema, model, type InferSchemaType } from "mongoose";

export const REPORT_CATEGORIES = [
  "listing",
  "landlord",
  "agent",
  "realtor",
  "user",
  "complaint",
  "query",
  "suspicious_activity",
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = ["open", "under_review", "resolved", "rejected"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: REPORT_CATEGORIES, required: true },
    // What's being reported, when it's a specific listing or person.
    targetListingId: { type: Schema.Types.ObjectId, ref: "Listing", default: null },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: REPORT_STATUSES, default: "open", index: true },
    // Visible to the reporter once set.
    resolution: { type: String },
    handledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    handledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export type ReportDoc = InferSchemaType<typeof reportSchema>;
export const Report = model("Report", reportSchema);
