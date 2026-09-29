import { Schema, model, type InferSchemaType } from "mongoose";

export const LISTING_STATUSES = ["active", "paused", "pending", "removed"] as const;
export const PROPERTY_TYPES = ["apartment", "house", "duplex", "land", "commercial", "shortlet", "other"] as const;

const moneySchema = new Schema(
  {
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    // Owner of the listing: a landlord, or a realtor/agent listing on an owner's behalf.
    // (Field name kept for compatibility with existing documents.)
    landlordId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["rent", "sale"], required: true },
    propertyType: { type: String, enum: PROPERTY_TYPES, default: "apartment" },
    furnished: { type: Boolean, default: false },
    address: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: moneySchema, required: true },
    negotiable: { type: Boolean, default: false },
    beds: { type: Number, required: true },
    baths: { type: Number, required: true },
    sqft: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    availabilityDates: { type: [String], default: [] },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: "pending",
      index: true,
    },
    // Set when an admin removes a listing, shown to the owner.
    moderationNote: { type: String },
  },
  { timestamps: true }
);

listingSchema.index({ status: 1, createdAt: -1 });

export type ListingDoc = InferSchemaType<typeof listingSchema>;
export const Listing = model("Listing", listingSchema);
