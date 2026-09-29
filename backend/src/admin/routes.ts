import type { FastifyInstance } from "fastify";
import { User, ACCOUNT_STATUSES } from "../models/User.js";
import { Listing } from "../models/Listing.js";
import { Inquiry } from "../models/Inquiry.js";
import { AgentRequest } from "../models/AgentRequest.js";
import { Report, REPORT_STATUSES } from "../models/Report.js";
import { requireAdmin } from "../auth/middleware.js";
import { bool, objectId, oneOf, str } from "../lib/validate.js";
import { DASHBOARD_BASE, notify } from "../notifications/service.js";
import { toPublicListing } from "../listings/routes.js";
import { toPublicReport } from "../engagement/routes.js";
import { toPublicUser } from "../auth/routes.js";

function person(u: any, extra: Record<string, unknown> = {}) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    verified: u.verified,
    avatarUrl: u.avatarUrl ?? null,
    status: u.status ?? "active",
    createdAt: u.createdAt,
    ...extra,
  };
}

async function listingCounts(ids: unknown[]) {
  const counts = await Listing.aggregate([
    { $match: { landlordId: { $in: ids } } },
    { $group: { _id: "$landlordId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count as number]));
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  // Encapsulated so the admin guard applies to exactly these routes.
  await app.register(async (admin) => {
    admin.addHook("preHandler", requireAdmin);
    adminRoutes(admin);
  });
}

function adminRoutes(app: FastifyInstance): void {

  /* ───────── Overview ───────── */

  app.get("/admin/stats", async () => {
    const [
      totalListings,
      activeListings,
      pausedListings,
      pendingListings,
      removedListings,
      totalLandlords,
      totalAgents,
      totalRealtors,
      totalMembers,
      pendingApprovals,
      suspendedAccounts,
      openReports,
      reviewingReports,
      totalInquiries,
      totalAgentRequests,
    ] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ status: "active" }),
      Listing.countDocuments({ status: "paused" }),
      Listing.countDocuments({ status: "pending" }),
      Listing.countDocuments({ status: "removed" }),
      User.countDocuments({ role: "landlord" }),
      User.countDocuments({ role: "agent" }),
      User.countDocuments({ role: "realtor" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: { $in: ["landlord", "agent", "realtor"] }, verified: false, status: { $nin: ["suspended", "deactivated"] } }),
      User.countDocuments({ status: "suspended" }),
      Report.countDocuments({ status: "open" }),
      Report.countDocuments({ status: "under_review" }),
      Inquiry.countDocuments(),
      AgentRequest.countDocuments(),
    ]);
    return {
      totalListings,
      activeListings,
      pausedListings,
      pendingListings,
      removedListings,
      totalLandlords,
      totalAgents,
      totalRealtors,
      totalMembers,
      totalUsers: totalMembers + totalLandlords + totalAgents + totalRealtors,
      pendingApprovals,
      suspendedAccounts,
      openReports,
      reviewingReports,
      totalInquiries,
      totalAgentRequests,
    };
  });

  /* ───────── Directories ───────── */

  app.get("/admin/users", async () => {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 }).lean();
    return users.map((u) => person(u));
  });

  app.get("/admin/landlords", async () => {
    const landlords = await User.find({ role: "landlord" }).sort({ createdAt: -1 }).lean();
    const counts = await listingCounts(landlords.map((l) => l._id));
    return landlords.map((l) => person(l, { listingCount: counts.get(String(l._id)) ?? 0 }));
  });

  app.get("/admin/agents", async () => {
    const agents = await User.find({ role: "agent" }).sort({ createdAt: -1 }).lean();
    return agents.map((a) => person(a, { areasCovered: a.areasCovered ?? [] }));
  });

  app.get("/admin/realtors", async () => {
    const realtors = await User.find({ role: "realtor" }).sort({ createdAt: -1 }).lean();
    const counts = await listingCounts(realtors.map((r) => r._id));
    return realtors.map((r) =>
      person(r, { areasCovered: r.areasCovered ?? [], listingCount: counts.get(String(r._id)) ?? 0 })
    );
  });

  /** Everything an admin needs to judge an account in one call. */
  app.get("/admin/people/:id", async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Account id");
    const user = await User.findById(id).lean();
    if (!user || user.role === "admin") return reply.code(404).send({ error: "Account not found." });

    const [listings, reportsAgainst, reportsFiled, inquiriesReceived, inquiriesSent] = await Promise.all([
      Listing.find({ landlordId: id }).sort({ createdAt: -1 }).lean(),
      Report.find({ targetUserId: id }).sort({ createdAt: -1 }).populate("reporterId", "name role email").lean(),
      Report.countDocuments({ reporterId: id }),
      Inquiry.countDocuments({ landlordId: id }),
      Inquiry.countDocuments({ userId: id }),
    ]);
    return {
      person: { ...toPublicUser(user), statusReason: user.statusReason ?? null, statusChangedAt: user.statusChangedAt ?? null },
      listings: listings.map((l) => toPublicListing(l)),
      reportsAgainst: reportsAgainst.map(toPublicReport),
      counts: { reportsFiled, inquiriesReceived, inquiriesSent },
    };
  });

  /* ───────── Account actions ───────── */

  app.patch("/admin/people/:id/status", async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Account id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const status = oneOf(body.status, ACCOUNT_STATUSES, "Status")!;
    const reason = str(body.reason, "Reason", { max: 500, required: status !== "active" });

    const user = await User.findById(id);
    if (!user || user.role === "admin") return reply.code(404).send({ error: "Account not found." });

    user.status = status;
    user.statusReason = reason;
    user.statusChangedAt = new Date();
    await user.save();

    if (status === "active") {
      await notify(user._id, {
        type: "account.reactivated",
        title: "Your account is active again",
        body: reason ?? "You have full access to Housify.",
        link: DASHBOARD_BASE[user.role],
      });
    }
    // Suspended/deactivated people can't sign in to read a notification; the
    // reason is returned to them at login instead.
    return { person: person(user.toObject()) };
  });

  app.patch("/admin/people/:id/verification", async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Account id");
    const verified = bool((request.body as Record<string, unknown> | undefined)?.verified);
    if (verified === undefined) return reply.code(400).send({ error: "verified is required." });

    const user = await User.findById(id);
    if (!user || user.role === "admin") return reply.code(404).send({ error: "Account not found." });
    user.verified = verified;
    await user.save();

    await notify(user._id, {
      type: verified ? "account.verified" : "account.unverified",
      title: verified ? "You're verified" : "Verification removed",
      body: verified
        ? "Your profile now shows the Housify verified badge."
        : "Your verified badge was removed. Contact support if you think this is a mistake.",
      link: `${DASHBOARD_BASE[user.role]}/profile`,
    });
    return { person: person(user.toObject()) };
  });

  /* ───────── Listings moderation ───────── */

  app.get("/admin/listings", async () => {
    const listings = await Listing.find().sort({ createdAt: -1 }).populate("landlordId", "name role").lean();
    return listings.map((l: any) => ({
      id: String(l._id),
      title: l.title,
      address: l.address,
      location: l.location,
      type: l.type,
      price: l.price,
      beds: l.beds,
      baths: l.baths,
      photo: l.photos?.[0] ?? null,
      status: l.status,
      moderationNote: l.moderationNote ?? null,
      landlordName: l.landlordId?.name ?? "—",
      ownerId: l.landlordId?._id ? String(l.landlordId._id) : null,
      ownerRole: l.landlordId?.role ?? null,
      createdAt: l.createdAt,
    }));
  });

  app.patch("/admin/listings/:id/status", async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Listing id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const status = oneOf(body.status, ["active", "paused", "removed"] as const, "Status")!;
    const note = str(body.note, "Note", { max: 500, required: status === "removed" });

    const listing = await Listing.findById(id);
    if (!listing) return reply.code(404).send({ error: "Listing not found." });
    const wasRemoved = listing.status === "removed";
    listing.status = status;
    listing.moderationNote = status === "removed" ? note : undefined;
    await listing.save();

    const owner = await User.findById(listing.landlordId).select("role").lean();
    const base = DASHBOARD_BASE[owner?.role ?? "landlord"];
    if (status === "removed") {
      await notify(listing.landlordId, {
        type: "listing.removed",
        title: "A listing was removed",
        body: `“${listing.title}” was removed by Housify: ${note}`,
        link: `${base}/listings`,
      });
    } else if (wasRemoved) {
      await notify(listing.landlordId, {
        type: "listing.restored",
        title: "A listing was restored",
        body: `“${listing.title}” has been restored.`,
        link: `${base}/listings`,
      });
    }
    return { listing: toPublicListing(listing.toObject()) };
  });

  /* ───────── Reports ───────── */

  app.get("/admin/reports", async (request) => {
    const q = request.query as { status?: string };
    const filter = q.status && (REPORT_STATUSES as readonly string[]).includes(q.status) ? { status: q.status } : {};
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("reporterId", "name role email")
      .populate("targetListingId", "title status")
      .populate("targetUserId", "name role status")
      .lean();
    return reports.map(toPublicReport);
  });

  app.patch("/admin/reports/:id", async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Report id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const status = oneOf(body.status, REPORT_STATUSES, "Status")!;
    const resolution = str(body.resolution, "Resolution note", {
      max: 2000,
      required: status === "resolved" || status === "rejected",
    });

    const report = await Report.findById(id);
    if (!report) return reply.code(404).send({ error: "Report not found." });
    const changed = report.status !== status;
    report.status = status;
    if (resolution !== undefined) report.resolution = resolution;
    report.handledBy = request.authUser!.sub as any;
    report.handledAt = new Date();
    await report.save();

    if (changed) {
      const copy: Record<string, string> = {
        under_review: "is now under review",
        resolved: "has been resolved",
        rejected: "was closed",
        open: "was reopened",
      };
      const reporter = await User.findById(report.reporterId).select("role").lean();
      await notify(report.reporterId, {
        type: "report.status",
        title: "Update on your report",
        body: `“${report.subject}” ${copy[status]}.${resolution ? ` ${resolution}` : ""}`,
        link: `${DASHBOARD_BASE[reporter?.role ?? "user"]}/support`,
      });
    }

    const populated = await Report.findById(id)
      .populate("reporterId", "name role email")
      .populate("targetListingId", "title status")
      .populate("targetUserId", "name role status")
      .lean();
    return { report: toPublicReport(populated) };
  });

  /* ───────── Activity ───────── */

  app.get("/admin/activity", async () => {
    const [inquiries, requests] = await Promise.all([
      Inquiry.find().sort({ createdAt: -1 }).limit(25).populate("listingId", "title").populate("landlordId", "name role").lean(),
      AgentRequest.find().sort({ createdAt: -1 }).limit(25).populate("agentId", "name").lean(),
    ]);
    return {
      inquiries: inquiries.map((i: any) => ({
        id: String(i._id),
        from: i.name,
        listingTitle: i.listingId?.title ?? "Deleted listing",
        ownerName: i.landlordId?.name ?? "—",
        status: i.status,
        createdAt: i.createdAt,
      })),
      agentRequests: requests.map((r: any) => ({
        id: String(r._id),
        from: r.name,
        area: r.area,
        agentName: r.agentId?.name ?? null,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  });
}
