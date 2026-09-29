import type { FastifyInstance } from "fastify";
import { Favorite } from "../models/Favorite.js";
import { Listing } from "../models/Listing.js";
import { Notification } from "../models/Notification.js";
import { Report, REPORT_CATEGORIES } from "../models/Report.js";
import { User } from "../models/User.js";
import { requireAuth } from "../auth/middleware.js";
import { objectId, oneOf, optionalObjectId, requiredStr } from "../lib/validate.js";
import { notifyAdmins, toPublicNotification } from "../notifications/service.js";
import { toPublicListing } from "../listings/routes.js";

/** Categories that must point at a specific listing or person. */
const PERSON_CATEGORIES = ["landlord", "agent", "realtor", "user"];

export function toPublicReport(r: any) {
  const listing = r.targetListingId && typeof r.targetListingId === "object" && "title" in r.targetListingId ? r.targetListingId : null;
  const person = r.targetUserId && typeof r.targetUserId === "object" && "name" in r.targetUserId ? r.targetUserId : null;
  const reporter = r.reporterId && typeof r.reporterId === "object" && "name" in r.reporterId ? r.reporterId : null;
  return {
    id: String(r._id),
    category: r.category,
    subject: r.subject,
    message: r.message,
    status: r.status,
    resolution: r.resolution ?? null,
    targetListing: listing ? { id: String(listing._id), title: listing.title, status: listing.status } : r.targetListingId ? { id: String(r.targetListingId) } : null,
    targetUser: person
      ? { id: String(person._id), name: person.name, role: person.role, status: person.status }
      : r.targetUserId
        ? { id: String(r.targetUserId) }
        : null,
    reporter: reporter ? { id: String(reporter._id), name: reporter.name, role: reporter.role, email: reporter.email } : null,
    handledAt: r.handledAt ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function registerEngagementRoutes(app: FastifyInstance): Promise<void> {
  /* ───────── Favorites ───────── */

  app.get("/me/favorites", { preHandler: requireAuth }, async (request) => {
    const favs = await Favorite.find({ userId: request.authUser!.sub })
      .sort({ createdAt: -1 })
      .populate({ path: "listingId", populate: { path: "landlordId", select: "name role verified status" } })
      .lean();
    return favs
      .filter((f: any) => f.listingId)
      .map((f: any) => {
        const owner = f.listingId.landlordId;
        return {
          savedAt: f.createdAt,
          // Saved listings stay visible even if paused, so people can see what changed.
          available: f.listingId.status === "active" && (owner?.status ?? "active") === "active",
          listing: toPublicListing(f.listingId),
        };
      });
  });

  app.get("/me/favorites/ids", { preHandler: requireAuth }, async (request) => {
    const favs = await Favorite.find({ userId: request.authUser!.sub }).select("listingId").lean();
    return favs.map((f) => String(f.listingId));
  });

  app.put("/me/favorites/:listingId", { preHandler: requireAuth }, async (request, reply) => {
    const listingId = objectId((request.params as { listingId: string }).listingId, "Listing id");
    const listing = await Listing.findById(listingId).select("status").lean();
    if (!listing || listing.status === "removed") return reply.code(404).send({ error: "Listing not found." });
    await Favorite.updateOne(
      { userId: request.authUser!.sub, listingId },
      { $setOnInsert: { userId: request.authUser!.sub, listingId } },
      { upsert: true }
    );
    return { ok: true, saved: true };
  });

  app.delete("/me/favorites/:listingId", { preHandler: requireAuth }, async (request) => {
    const listingId = objectId((request.params as { listingId: string }).listingId, "Listing id");
    await Favorite.deleteOne({ userId: request.authUser!.sub, listingId });
    return { ok: true, saved: false };
  });

  /* ───────── Notifications ───────── */

  app.get("/notifications", { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser!.sub;
    const [items, unread] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ userId, readAt: null }),
    ]);
    return { items: items.map(toPublicNotification), unread };
  });

  app.post("/notifications/:id/read", { preHandler: requireAuth }, async (request) => {
    const id = objectId((request.params as { id: string }).id, "Notification id");
    await Notification.updateOne({ _id: id, userId: request.authUser!.sub, readAt: null }, { readAt: new Date() });
    return { ok: true };
  });

  app.post("/notifications/read-all", { preHandler: requireAuth }, async (request) => {
    await Notification.updateMany({ userId: request.authUser!.sub, readAt: null }, { readAt: new Date() });
    return { ok: true };
  });

  /* ───────── Reports, complaints & queries ───────── */

  app.post(
    "/reports",
    { preHandler: requireAuth, config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const category = oneOf(body.category, REPORT_CATEGORIES, "Category")!;
      const targetListingId = optionalObjectId(body.targetListingId, "Listing");
      const targetUserId = optionalObjectId(body.targetUserId, "Person");

      if (category === "listing") {
        if (!targetListingId) return reply.code(400).send({ error: "Choose the listing you're reporting." });
        if (!(await Listing.exists({ _id: targetListingId }))) return reply.code(404).send({ error: "Listing not found." });
      }
      if (PERSON_CATEGORIES.includes(category)) {
        if (!targetUserId) return reply.code(400).send({ error: "Choose the person you're reporting." });
        if (targetUserId === request.authUser!.sub) return reply.code(400).send({ error: "You can't report yourself." });
        const target = await User.findById(targetUserId).select("role").lean();
        if (!target || target.role === "admin") return reply.code(404).send({ error: "That person wasn't found." });
      }

      const report = await Report.create({
        reporterId: request.authUser!.sub,
        category,
        targetListingId: category === "listing" ? targetListingId : null,
        targetUserId: PERSON_CATEGORIES.includes(category) ? targetUserId : null,
        subject: requiredStr(body.subject, "Subject", 140),
        message: requiredStr(body.message, "Details", 4000),
      });

      await notifyAdmins({
        type: "report.new",
        title: category === "query" ? "New query" : category === "complaint" ? "New complaint" : "New report",
        body: report.subject,
        link: "/admin/reports",
      });
      return reply.code(201).send({ report: toPublicReport(report.toObject()) });
    }
  );

  app.get("/reports/mine", { preHandler: requireAuth }, async (request) => {
    const reports = await Report.find({ reporterId: request.authUser!.sub })
      .sort({ createdAt: -1 })
      .populate("targetListingId", "title status")
      .populate("targetUserId", "name role status")
      .lean();
    return reports.map(toPublicReport);
  });
}
