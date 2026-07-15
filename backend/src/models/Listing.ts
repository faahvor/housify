import { Schema, model, type InferSchemaType } from "mongoose";

const moneySchema = new Schema(
  {
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    landlordId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["rent", "sale"], required: true },
    address: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: moneySchema, required: true },
    negotiable: { type: Boolean, default: false },
    beds: { type: Number, required: true },
    baths: { type: Number, required: true },
    sqft: { type: Number, required: true },
    photos: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    availabilityDates: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "paused", "pending", "removed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export type ListingDoc = InferSchemaType<typeof listingSchema>;
export const Listing = model("Listing", listingSchema);
