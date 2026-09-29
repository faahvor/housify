import { Schema, model, type InferSchemaType } from "mongoose";

export const INQUIRY_STATUSES = ["new", "contacted", "viewing_scheduled", "closed", "declined"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

const inquirySchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    // Listing owner at the time of the inquiry.
    landlordId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Set when the sender was signed in, so they can track it from their dashboard.
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    requestedDate: { type: String },
    message: { type: String },
    status: { type: String, enum: INQUIRY_STATUSES, default: "new" },
    ownerNote: { type: String },
  },
  { timestamps: true }
);

export type InquiryDoc = InferSchemaType<typeof inquirySchema>;
export const Inquiry = model("Inquiry", inquirySchema);
