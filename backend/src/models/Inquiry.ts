import { Schema, model, type InferSchemaType } from "mongoose";

const inquirySchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    landlordId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    requestedDate: { type: String },
    message: { type: String },
    status: { type: String, enum: ["new", "confirmed", "declined"], default: "new" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type InquiryDoc = InferSchemaType<typeof inquirySchema>;
export const Inquiry = model("Inquiry", inquirySchema);
