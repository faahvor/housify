import type { FastifyInstance } from "fastify";
import { User, LISTING_ROLES } from "../models/User.js";
import { Listing } from "../models/Listing.js";
import { escapeRegex, num, objectId } from "../lib/validate.js";
import { toPublicListing } from "../listings/routes.js";

const HIDDEN = { $nin: ["suspended", "deactivated"] };

function toPublicProfessional(u: any, extra: Record<string, unknown> = {}) {
  return {
    id: String(u._id),
    role: u.role,
    name: u.name,
    bio: u.bio ?? null,
    verified: !!u.verified,
    avatarUrl: u.avatarUrl ?? null,
    states: u.states ?? [],
    areasCovered: u.areasCovered ?? [],
    experience: u.experience ?? null,
    memberSince: u.createdAt,
    ...extra,
  };
}

export async function registerProfessionalRoutes(app: FastifyInstance): Promise<void> {
  // Public directory of landlords, agents and realtors. Verified people first.
  app.get("/professionals", async (request) => {
    const q = request.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = { role: { $in: LISTING_ROLES }, status: HIDDEN };
    if (q.role && (LISTING_ROLES as readonly string[]).includes(q.role)) filter.role = q.role;
    if (q.verified === "true") filter.verified = true;
    const and: Record<string, unknown>[] = [];
    if (q.q) {
      const rx = new RegExp(escapeRegex(q.q.slice(0, 80)), "i");
      and.push({ $or: [{ name: rx }, { bio: rx }] });
    }
    if (q.area) {
      const rx = new RegExp(escapeRegex(q.area.slice(0, 80)), "i");
      and.push({ $or: [{ areasCovered: rx }, { states: rx }] });
    }
    if (and.length) filter.$and = and;

    const limit = Math.min(num(q.limit, "Limit", { min: 1, max: 60 }) ?? 24, 60);
    const page = num(q.page, "Page", { min: 1, max: 10_000 }) ?? 1;

    const [people, total] = await Promise.all([
      User.find(filter)
        .sort({ verified: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("role name bio verified avatarUrl states areasCovered experience createdAt")
        .lean(),
      User.countDocuments(filter),
    ]);

    const counts = await Listing.aggregate([
      { $match: { landlordId: { $in: people.map((p) => p._id) }, status: "active" } },
      { $group: { _id: "$landlordId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count as number]));

    return {
      items: people.map((p) => toPublicProfessional(p, { liveListings: countMap.get(String(p._id)) ?? 0 })),
      total,
      page,
      pageSize: limit,
    };
  });

  // One professional's public profile with their live listings and contact details.
  app.get("/professionals/:id", async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Profile id");
    const user = await User.findOne({ _id: id, role: { $in: LISTING_ROLES }, status: HIDDEN }).lean();
    if (!user) return reply.code(404).send({ error: "This profile isn't available." });

    const listings = await Listing.find({ landlordId: id, status: "active" }).sort({ createdAt: -1 }).limit(60).lean();
    return {
      profile: toPublicProfessional(user, {
        phone: user.phone ?? null,
        whatsapp: user.whatsapp ?? null,
        liveListings: listings.length,
      }),
      listings: listings.map((l) =>
        toPublicListing({ ...l, landlordId: { _id: user._id, name: user.name, role: user.role, verified: user.verified, avatarUrl: user.avatarUrl } })
      ),
    };
  });
}
