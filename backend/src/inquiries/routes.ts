import type { FastifyInstance } from "fastify";
import { Inquiry, INQUIRY_STATUSES } from "../models/Inquiry.js";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { optionalAuth, requireAuth } from "../auth/middleware.js";
import { email as emailField, objectId, oneOf, requiredStr, str } from "../lib/validate.js";
import { DASHBOARD_BASE, notify } from "../notifications/service.js";

const STATUS_COPY: Record<string, string> = {
  contacted: "The owner has been in touch about",
  viewing_scheduled: "A viewing has been scheduled for",
  closed: "Your inquiry was closed for",
  declined: "The owner declined your inquiry about",
};

function toPublicInquiry(i: any) {
  const listing = i.listingId && typeof i.listingId === "object" && "title" in i.listingId ? i.listingId : null;
  return {
    id: String(i._id),
    listingId: String(listing?._id ?? i.listingId),
    listing: listing
      ? {
          id: String(listing._id),
          title: listing.title,
          location: listing.location,
          photo: listing.photos?.[0] ?? null,
          type: listing.type,
          price: listing.price,
        }
      : null,
    name: i.name,
    email: i.email,
    phone: i.phone,
    requestedDate: i.requestedDate ?? null,
    message: i.message ?? null,
    status: i.status,
    ownerNote: i.ownerNote ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

const LISTING_FIELDS = "title location photos type price";

export async function registerInquiryRoutes(app: FastifyInstance): Promise<void> {
  // Anyone can ask about a live listing; signed-in senders can track it afterwards.
  app.post(
    "/listings/:id/inquiries",
    { preHandler: optionalAuth, config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const listingId = objectId((request.params as { id: string }).id, "Listing id");
      const body = (request.body ?? {}) as Record<string, unknown>;

      const listing = await Listing.findById(listingId).lean();
      if (!listing || listing.status !== "active") {
        return reply.code(404).send({ error: "This listing is no longer available." });
      }
      const viewer = request.authUser;
      if (viewer && viewer.sub === String(listing.landlordId)) {
        return reply.code(400).send({ error: "You can't send an inquiry about your own listing." });
      }

      const inquiry = await Inquiry.create({
        listingId,
        landlordId: listing.landlordId,
        userId: viewer?.sub ?? null,
        name: requiredStr(body.name, "Name", 100),
        email: emailField(body.email)!,
        phone: requiredStr(body.phone, "Phone", 30),
        requestedDate: str(body.requestedDate, "Preferred date", { max: 40 }),
        message: str(body.message, "Message", { max: 2000 }),
      });

      const owner = await User.findById(listing.landlordId).select("role").lean();
      await notify(listing.landlordId, {
        type: "inquiry.new",
        title: "New inquiry",
        body: `${inquiry.name} asked about “${listing.title}”.`,
        link: `${DASHBOARD_BASE[owner?.role ?? "landlord"]}/inquiries`,
      });

      return reply.code(201).send({ inquiry: toPublicInquiry(inquiry.toObject()) });
    }
  );

  // Inquiries on listings I own.
  app.get("/inquiries/received", { preHandler: requireAuth }, async (request) => {
    const items = await Inquiry.find({ landlordId: request.authUser!.sub })
      .sort({ createdAt: -1 })
      .populate("listingId", LISTING_FIELDS)
      .lean();
    return items.map(toPublicInquiry);
  });

  // Inquiries I sent while signed in.
  app.get("/inquiries/sent", { preHandler: requireAuth }, async (request) => {
    const items = await Inquiry.find({ userId: request.authUser!.sub })
      .sort({ createdAt: -1 })
      .populate("listingId", LISTING_FIELDS)
      .populate("landlordId", "name role verified")
      .lean();
    return items.map((i: any) => {
      // Contact details echo the sender; the owner's note is private to the owner.
      const { email: _e, phone: _p, ownerNote: _n, ...rest } = toPublicInquiry(i);
      const owner = i.landlordId && typeof i.landlordId === "object" && "name" in i.landlordId ? i.landlordId : null;
      return { ...rest, owner: owner ? { id: String(owner._id), name: owner.name, role: owner.role, verified: owner.verified } : null };
    });
  });

  app.patch("/inquiries/:id", { preHandler: requireAuth }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Inquiry id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const inquiry = await Inquiry.findById(id).populate("listingId", LISTING_FIELDS);
    if (!inquiry) return reply.code(404).send({ error: "Inquiry not found." });
    if (String(inquiry.landlordId) !== request.authUser!.sub) {
      return reply.code(403).send({ error: "This inquiry isn't about one of your listings." });
    }

    const status = oneOf(body.status, INQUIRY_STATUSES, "Status", false);
    if (body.ownerNote !== undefined) inquiry.ownerNote = str(body.ownerNote, "Note", { max: 1000 }) ?? undefined;
    const changed = status && status !== inquiry.status;
    if (status) inquiry.status = status;
    await inquiry.save();

    if (changed && inquiry.userId && STATUS_COPY[status]) {
      const title = (inquiry.listingId as any)?.title ?? "a listing";
      await notify(inquiry.userId, {
        type: "inquiry.status",
        title: "Inquiry update",
        body: `${STATUS_COPY[status]} “${title}”.`,
        link: "/dashboard/inquiries",
      });
    }
    return { inquiry: toPublicInquiry(inquiry.toObject()) };
  });
}
