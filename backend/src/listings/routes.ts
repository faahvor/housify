import type { FastifyInstance } from "fastify";
import { Listing, PROPERTY_TYPES } from "../models/Listing.js";
import { User, LISTING_ROLES } from "../models/User.js";
import { optionalAuth, requireAuth, requireRole } from "../auth/middleware.js";
import { bool, escapeRegex, num, objectId, oneOf, requiredStr, str, strList, urlList } from "../lib/validate.js";

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { "price.amount": 1 },
  price_desc: { "price.amount": -1 },
} as const;

/** Fields an owner may set on create/edit. `partial` skips required checks for PATCH. */
function parseListingInput(body: Record<string, unknown>, partial: boolean) {
  const required = !partial;
  const out: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value;
  };

  set("title", str(body.title, "Title", { required, max: 140 }));
  set("description", str(body.description, "Description", { required, max: 5000 }));
  set("type", oneOf(body.type, ["rent", "sale"] as const, "Listing type", required));
  set("propertyType", oneOf(body.propertyType, PROPERTY_TYPES, "Property type", false));
  set("furnished", bool(body.furnished));
  set("address", str(body.address, "Address", { required, max: 300 }));
  set("location", str(body.location, "Location", { required, max: 120 }));
  if (body.price !== undefined || required) {
    const price = (body.price ?? {}) as Record<string, unknown>;
    set("price", {
      currency: str(price.currency, "Currency", { max: 8 }) ?? "NGN",
      amount: num(price.amount, "Price", { required: true, min: 1, max: 1e13 }),
    });
  }
  set("negotiable", bool(body.negotiable));
  set("beds", num(body.beds, "Bedrooms", { required, max: 100 }));
  set("baths", num(body.baths, "Bathrooms", { required, max: 100 }));
  set("sqft", num(body.sqft, "Size", { required, max: 10_000_000 }));
  set("amenities", strList(body.amenities, "Amenities", 40, 60));
  set("photos", urlList(body.photos, "Photos"));
  set("videos", urlList(body.videos, "Videos", 5));
  set("availabilityDates", strList(body.availabilityDates, "Availability dates", 30, 40));
  return out;
}

/** Ids of owners whose listings must be hidden from the public. */
async function blockedOwnerIds() {
  // Accounts created before statuses existed have no field and count as active.
  const blocked = await User.find({ status: { $in: ["suspended", "deactivated"] } }).select("_id").lean();
  return blocked.map((u) => u._id);
}

export async function registerListingRoutes(app: FastifyInstance): Promise<void> {
  /* ───────── Public marketplace ───────── */

  // Real platform numbers for the landing page. The frontend hides any that are zero.
  app.get("/public/stats", async () => {
    const blocked = await blockedOwnerIds();
    const visible = { status: "active", landlordId: { $nin: blocked } };
    const [liveListings, verifiedProfessionals, locations] = await Promise.all([
      Listing.countDocuments(visible),
      User.countDocuments({ role: { $in: LISTING_ROLES }, verified: true, status: { $nin: ["suspended", "deactivated"] } }),
      Listing.distinct("location", visible),
    ]);
    return { liveListings, verifiedProfessionals, areas: locations.length };
  });

  app.get("/listings", async (request) => {
    const q = request.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = { status: "active", landlordId: { $nin: await blockedOwnerIds() } };

    if (q.type === "rent" || q.type === "sale") filter.type = q.type;
    if (q.propertyType && (PROPERTY_TYPES as readonly string[]).includes(q.propertyType)) filter.propertyType = q.propertyType;
    if (q.furnished === "true") filter.furnished = true;
    if (q.furnished === "false") filter.furnished = false;
    if (q.location) filter.location = new RegExp(escapeRegex(q.location.slice(0, 80)), "i");
    const minPrice = num(q.minPrice, "Minimum price");
    const maxPrice = num(q.maxPrice, "Maximum price");
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter["price.amount"] = { ...(minPrice !== undefined && { $gte: minPrice }), ...(maxPrice !== undefined && { $lte: maxPrice }) };
    }
    const beds = num(q.beds, "Bedrooms", { max: 100 });
    if (beds) filter.beds = { $gte: beds };
    const baths = num(q.baths, "Bathrooms", { max: 100 });
    if (baths) filter.baths = { $gte: baths };
    if (q.q) {
      const rx = new RegExp(escapeRegex(q.q.slice(0, 80)), "i");
      filter.$or = [{ title: rx }, { address: rx }, { location: rx }, { description: rx }];
    }

    const limit = Math.min(num(q.limit, "Limit", { min: 1, max: 60 }) ?? 24, 60);
    const page = num(q.page, "Page", { min: 1, max: 10_000 }) ?? 1;
    const sort = SORTS[(q.sort as keyof typeof SORTS) ?? "newest"] ?? SORTS.newest;

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("landlordId", "name role verified")
        .lean(),
      Listing.countDocuments(filter),
    ]);
    return { items: items.map((l) => toPublicListing(l)), total, page, pageSize: limit };
  });

  app.get("/listings/:id", { preHandler: optionalAuth }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Listing id");
    const listing = await Listing.findById(id).populate("landlordId", "name role verified phone whatsapp bio status createdAt").lean();
    if (!listing) return reply.code(404).send({ error: "Listing not found." });

    const owner = listing.landlordId as any;
    const viewer = request.authUser;
    const privileged = viewer && (viewer.role === "admin" || viewer.sub === String(owner?._id));
    if (!privileged && (listing.status !== "active" || (owner?.status ?? "active") !== "active")) {
      return reply.code(404).send({ error: "Listing not found." });
    }
    return { listing: toPublicListing(listing, { withContact: true }) };
  });

  /* ───────── Owner tools ───────── */

  app.post("/listings", { preHandler: requireRole(...LISTING_ROLES) }, async (request, reply) => {
    const data = parseListingInput((request.body ?? {}) as Record<string, unknown>, false);
    const listing = await Listing.create({ ...data, landlordId: request.authUser!.sub, status: "active" });
    return reply.code(201).send({ listing: toPublicListing(listing.toObject()) });
  });

  app.get("/listings/mine", { preHandler: requireAuth }, async (request) => {
    const listings = await Listing.find({ landlordId: request.authUser!.sub }).sort({ createdAt: -1 }).lean();
    return listings.map((l) => toPublicListing(l));
  });

  app.patch("/listings/:id", { preHandler: requireRole(...LISTING_ROLES) }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Listing id");
    const listing = await Listing.findById(id);
    if (!listing) return reply.code(404).send({ error: "Listing not found." });
    if (String(listing.landlordId) !== request.authUser!.sub) {
      return reply.code(403).send({ error: "You don't own this listing." });
    }
    if (listing.status === "removed") {
      return reply.code(409).send({ error: "This listing was removed by Housify and can't be edited." });
    }
    listing.set(parseListingInput((request.body ?? {}) as Record<string, unknown>, true));
    await listing.save();
    return { listing: toPublicListing(listing.toObject()) };
  });

  app.patch("/listings/:id/status", { preHandler: requireAuth }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Listing id");
    const status = oneOf((request.body as Record<string, unknown> | undefined)?.status, ["active", "paused"] as const, "Status")!;

    const listing = await Listing.findById(id);
    if (!listing) return reply.code(404).send({ error: "Listing not found." });
    if (String(listing.landlordId) !== request.authUser!.sub) {
      return reply.code(403).send({ error: "You don't own this listing." });
    }
    if (listing.status === "removed") {
      return reply.code(409).send({ error: "This listing was removed by Housify and can't be republished." });
    }

    listing.status = status;
    await listing.save();
    return { listing: toPublicListing(listing.toObject()) };
  });

  app.delete("/listings/:id", { preHandler: requireAuth }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Listing id");
    const listing = await Listing.findById(id);
    if (!listing) return reply.code(404).send({ error: "Listing not found." });
    if (String(listing.landlordId) !== request.authUser!.sub) {
      return reply.code(403).send({ error: "You don't own this listing." });
    }
    await listing.deleteOne();
    return { ok: true };
  });
}

export function toPublicListing(listing: any, opts: { withContact?: boolean } = {}) {
  const owner = listing.landlordId && typeof listing.landlordId === "object" && "name" in listing.landlordId ? listing.landlordId : null;
  return {
    id: String(listing._id),
    title: listing.title,
    description: listing.description,
    type: listing.type,
    propertyType: listing.propertyType ?? "apartment",
    furnished: listing.furnished ?? false,
    address: listing.address,
    location: listing.location,
    price: listing.price,
    negotiable: listing.negotiable,
    beds: listing.beds,
    baths: listing.baths,
    sqft: listing.sqft,
    amenities: listing.amenities ?? [],
    photos: listing.photos ?? [],
    videos: listing.videos ?? [],
    availabilityDates: listing.availabilityDates ?? [],
    status: listing.status,
    moderationNote: listing.moderationNote ?? null,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    ownerId: String(owner?._id ?? listing.landlordId),
    owner: owner
      ? {
          id: String(owner._id),
          name: owner.name,
          role: owner.role,
          verified: owner.verified,
          ...(opts.withContact && {
            phone: owner.phone ?? null,
            whatsapp: owner.whatsapp ?? null,
            bio: owner.bio ?? null,
            memberSince: owner.createdAt,
          }),
        }
      : null,
  };
}
