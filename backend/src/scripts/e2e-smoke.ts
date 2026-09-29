/**
 * End-to-end smoke test of the API against a throwaway database.
 *
 *   npm run test:e2e -w backend
 *
 * It connects to a uniquely named `housify_e2e_*` database on the same cluster as
 * MONGODB_URI (never the real database), exercises every role's flows through
 * `app.inject()` (no port is opened), then drops that database.
 */
import "./e2e-env.js";
import "dotenv/config";
import { rm } from "node:fs/promises";
import sharp from "sharp";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { buildApp } from "../app.js";
import { User } from "../models/User.js";
import { signToken } from "../auth/jwt.js";

const baseUri = process.env.MONGODB_URI;
if (!baseUri) throw new Error("MONGODB_URI is not set.");
const dbName = `housify_e2e_${Date.now()}`;
const testUri = baseUri.replace(/(mongodb(?:\+srv)?:\/\/[^/]+)\/?([^?]*)/, `$1/${dbName}`);
if (testUri === baseUri || !testUri.includes(dbName)) throw new Error("Couldn't derive an isolated test database URI.");

type Json = Record<string, any>;
let passed = 0;

async function main() {
  await mongoose.connect(testUri);
  const app = await buildApp({ logger: false });

  async function call(method: string, url: string, opts: { token?: string; body?: unknown } = {}) {
    const res = await app.inject({
      method: method as any,
      url,
      headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
      ...(opts.body !== undefined && { payload: opts.body as Json }),
    });
    return { status: res.statusCode, body: res.body ? (res.json() as Json) : {} };
  }
  /** POST one file as multipart/form-data. */
  async function upload(kind: string, token: string, filename: string, contentType: string, data: Buffer) {
    const boundary = `----housify${Date.now()}`;
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
      data,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const res = await app.inject({
      method: "POST",
      url: `/uploads?kind=${kind}`,
      headers: { authorization: `Bearer ${token}`, "content-type": `multipart/form-data; boundary=${boundary}` },
      payload,
    });
    return { status: res.statusCode, body: res.json() as Json };
  }
  async function step(name: string, fn: () => Promise<void>) {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  }
  const reg = (role: string, email: string, extra: Json = {}) =>
    call("POST", "/auth/register", { body: { role, name: `${role} tester`, email, password: "password123", phone: "0800000000", ...extra } });

  try {
    console.log(`Using isolated database ${dbName}\n`);
    let landlord = "", agent = "", realtor = "", user = "", admin = "", listingId = "", landlordId = "", userId = "";

    // The one admin is created directly, the same way the seed script does it.
    const adminDoc = await User.create({ role: "admin", name: "Admin", username: "admin", passwordHash: await bcrypt.hash("x", 4), verified: true });
    admin = signToken({ sub: adminDoc.id, role: "admin" });

    await step("self-registering as admin is rejected", async () => {
      const r = await reg("admin", "sneaky@test.dev");
      assert.equal(r.status, 400);
    });

    await step("each public role can register", async () => {
      const l = await reg("landlord", "landlord@test.dev");
      const a = await reg("agent", "agent@test.dev", { areasCovered: ["Lekki"], states: ["Lagos, Nigeria"] });
      const re = await reg("realtor", "realtor@test.dev");
      const u = await call("POST", "/auth/register", { body: { role: "user", name: "Renter Tester", email: "renter@test.dev", password: "password123" } });
      for (const r of [l, a, re, u]) assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.equal(u.body.user.verified, true, "renters don't need professional verification");
      assert.equal(l.body.user.verified, false);
      [landlord, agent, realtor, user] = [l.body.token, a.body.token, re.body.token, u.body.token];
      landlordId = l.body.user.id;
      userId = u.body.user.id;
    });

    await step("duplicate emails and bad input are rejected", async () => {
      assert.equal((await reg("landlord", "landlord@test.dev")).status, 409);
      assert.equal((await reg("landlord", "not-an-email")).status, 400);
    });

    await step("admin was notified about professionals awaiting verification", async () => {
      const n = await call("GET", "/notifications", { token: admin });
      assert.equal(n.body.unread, 3);
    });

    await step("profile edits persist to the database", async () => {
      const r = await call("PATCH", "/auth/me", { token: landlord, body: { bio: "I own flats in Lekki", states: ["Lagos, Nigeria"], areasCovered: ["Lekki"] } });
      assert.equal(r.status, 200);
      const me = await call("GET", "/auth/me", { token: landlord });
      assert.equal(me.body.user.bio, "I own flats in Lekki");
      assert.deepEqual(me.body.user.areasCovered, ["Lekki"]);
    });

    await step("password change checks the current password", async () => {
      assert.equal((await call("PATCH", "/auth/me/password", { token: user, body: { currentPassword: "wrong-one", newPassword: "newpassword1" } })).status, 400);
      assert.equal((await call("PATCH", "/auth/me/password", { token: user, body: { currentPassword: "password123", newPassword: "newpassword1" } })).status, 200);
      assert.equal((await call("POST", "/auth/login", { body: { identifier: "renter@test.dev", password: "newpassword1" } })).status, 200);
    });

    await step("renters can't create listings; landlords can", async () => {
      const body = { title: "2-bed flat in Lekki", description: "Bright, serviced.", type: "rent", address: "12 Admiralty Way", location: "Lekki, Lagos", price: { currency: "NGN", amount: 3500000 }, beds: 2, baths: 2, sqft: 1100, furnished: true, amenities: ["Parking"] };
      assert.equal((await call("POST", "/listings", { token: user, body })).status, 403);
      assert.equal((await call("POST", "/listings", { token: landlord, body: { ...body, title: "" } })).status, 400);
      const r = await call("POST", "/listings", { token: landlord, body });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      listingId = r.body.listing.id;
    });

    await step("listing owners can edit; others can't", async () => {
      assert.equal((await call("PATCH", `/listings/${listingId}`, { token: realtor, body: { beds: 3 } })).status, 403);
      const r = await call("PATCH", `/listings/${listingId}`, { token: landlord, body: { beds: 3 } });
      assert.equal(r.body.listing.beds, 3);
    });

    await step("uploads: photos are validated, resized, stripped and owner-only", async () => {
      const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#4f46e5" } })
        .jpeg()
        .withExif({ IFD0: { Copyright: "private" } })
        .toBuffer();
      const up = await upload("listing-photo", landlord, "living-room.jpg", "image/jpeg", big);
      assert.equal(up.status, 201, JSON.stringify(up.body));
      assert.equal(up.body.upload.contentType, "image/webp");
      assert.equal(up.body.upload.width, 2000, "resized to fit 2000px");

      const file = await app.inject({ method: "GET", url: new URL(up.body.upload.url).pathname });
      assert.equal(file.statusCode, 200);
      assert.equal(file.headers["content-type"], "image/webp");
      assert.equal((await sharp(file.rawPayload).metadata()).exif, undefined, "metadata is stripped");
      for (const probe of ["/uploads/", "/uploads/../.env", "/uploads/%2e%2e/.env"]) {
        const res = await app.inject({ method: "GET", url: probe });
        assert.ok([403, 404].includes(res.statusCode), `${probe} must be refused, got ${res.statusCode}`);
      }

      assert.equal((await upload("listing-photo", user, "x.jpg", "image/jpeg", big)).status, 403, "renters can't upload listing media");
      assert.equal((await upload("listing-photo", landlord, "fake.jpg", "image/jpeg", Buffer.from("not really an image"))).status, 400);
      assert.equal((await upload("nonsense", landlord, "x.jpg", "image/jpeg", big)).status, 400);

      const withPhoto = await call("PATCH", `/listings/${listingId}`, { token: landlord, body: { photos: [up.body.upload.url] } });
      assert.equal(withPhoto.status, 200, JSON.stringify(withPhoto.body));
      assert.deepEqual(withPhoto.body.listing.photos, [up.body.upload.url]);

      const stolen = await call("POST", "/listings", {
        token: agent,
        body: { title: "t", description: "d", type: "rent", address: "a", location: "Lekki", price: { amount: 1 }, beds: 1, baths: 1, sqft: 1, photos: [up.body.upload.url] },
      });
      assert.equal(stolen.status, 400, "can't list someone else's uploaded photo");

      assert.equal((await call("DELETE", `/uploads/${up.body.upload.id}`, { token: landlord })).status, 409, "in-use files can't be deleted");
      assert.equal((await call("DELETE", `/uploads/${up.body.upload.id}`, { token: agent })).status, 403);
    });

    await step("uploads: avatars and videos", async () => {
      const face = await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#0891b2" } }).png().toBuffer();
      const av = await upload("avatar", user, "me.png", "image/png", face);
      assert.equal(av.status, 201);
      assert.equal(av.body.upload.width, 512);
      assert.equal((await call("PATCH", "/auth/me", { token: user, body: { avatarUrl: av.body.upload.url } })).status, 200);
      assert.equal((await call("GET", "/auth/me", { token: user })).body.user.avatarUrl, av.body.upload.url);
      assert.equal((await call("PATCH", "/auth/me", { token: agent, body: { avatarUrl: av.body.upload.url } })).status, 400, "can't use someone else's photo");

      const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(64)]);
      const vid = await upload("listing-video", landlord, "tour.mp4", "video/mp4", mp4);
      assert.equal(vid.status, 201);
      assert.equal(vid.body.upload.contentType, "video/mp4");
      assert.equal((await upload("listing-video", landlord, "tour.mp4", "video/mp4", Buffer.from("definitely not a video"))).status, 400);
      assert.equal((await call("DELETE", `/uploads/${vid.body.upload.id}`, { token: landlord })).status, 200, "unused files can be deleted");
    });

    await step("public search and filters", async () => {
      assert.equal((await call("GET", "/listings")).body.total, 1);
      assert.equal((await call("GET", "/listings?type=sale")).body.total, 0);
      assert.equal((await call("GET", "/listings?q=lekki&furnished=true&beds=3")).body.total, 1);
      const one = await call("GET", `/listings/${listingId}`);
      assert.equal(one.body.listing.owner.name, "landlord tester");
    });

    await step("inquiry → owner notified → status update → sender notified", async () => {
      const i = await call("POST", `/listings/${listingId}/inquiries`, { token: user, body: { name: "Renter Tester", email: "renter@test.dev", phone: "0811111111", message: "Is it available?" } });
      assert.equal(i.status, 201, JSON.stringify(i.body));
      assert.equal((await call("POST", `/listings/${listingId}/inquiries`, { token: landlord, body: { name: "x", email: "x@y.z", phone: "1" } })).status, 400, "owners can't inquire on their own listing");
      const received = await call("GET", "/inquiries/received", { token: landlord });
      assert.equal(received.body.length, 1);
      assert.equal((await call("GET", "/notifications", { token: landlord })).body.unread, 1);
      assert.equal((await call("PATCH", `/inquiries/${i.body.inquiry.id}`, { token: agent, body: { status: "contacted" } })).status, 403);
      await call("PATCH", `/inquiries/${i.body.inquiry.id}`, { token: landlord, body: { status: "viewing_scheduled", ownerNote: "Seems serious" } });
      const sent = await call("GET", "/inquiries/sent", { token: user });
      assert.equal(sent.body[0].status, "viewing_scheduled");
      assert.equal(sent.body[0].owner.name, "landlord tester");
      assert.equal(sent.body[0].email, undefined, "sender view doesn't echo contact details");
      assert.equal(sent.body[0].ownerNote, undefined, "owner notes stay private");
      assert.equal((await call("GET", "/notifications", { token: user })).body.unread, 1);
    });

    await step("favorites", async () => {
      await call("PUT", `/me/favorites/${listingId}`, { token: user });
      await call("PUT", `/me/favorites/${listingId}`, { token: user });
      const favs = await call("GET", "/me/favorites", { token: user });
      assert.equal(favs.body.length, 1, "saving twice is idempotent");
      assert.deepEqual((await call("GET", "/me/favorites/ids", { token: user })).body, [listingId]);
      await call("DELETE", `/me/favorites/${listingId}`, { token: user });
      assert.equal((await call("GET", "/me/favorites", { token: user })).body.length, 0);
      await call("PUT", `/me/favorites/${listingId}`, { token: user });
    });

    await step("open agent request → agent in that area claims it → requester notified", async () => {
      const r = await call("POST", "/agent-requests", { token: user, body: { name: "Renter Tester", contact: "0811111111", area: "Lekki", lookingFor: "3-bed" } });
      assert.equal(r.status, 201);
      const incoming = await call("GET", "/agent-requests/incoming", { token: agent });
      assert.equal(incoming.body.length, 1);
      assert.equal(incoming.body[0].contact, null, "contact hidden until accepted");
      assert.equal((await call("GET", "/agent-requests/incoming", { token: landlord })).status, 403);
      const accepted = await call("PATCH", `/agent-requests/${r.body.request.id}`, { token: agent, body: { status: "accepted" } });
      assert.equal(accepted.body.request.contact, "0811111111");
      const mine = await call("GET", "/agent-requests/mine", { token: user });
      assert.equal(mine.body[0].agent.name, "agent tester");
      await call("PATCH", `/agent-requests/${r.body.request.id}`, { token: agent, body: { agentNote: "Budget is tight" } });
      assert.equal((await call("GET", "/agent-requests/mine", { token: user })).body[0].agentNote, undefined, "agent notes stay private");
    });

    await step("notifications can be marked read", async () => {
      await call("POST", "/notifications/read-all", { token: user });
      assert.equal((await call("GET", "/notifications", { token: user })).body.unread, 0);
    });

    let reportId = "";
    await step("report a listing → admin reviews and resolves → reporter notified", async () => {
      assert.equal((await call("POST", "/reports", { token: user, body: { category: "listing", subject: "Wrong price", message: "Owner asked for more." } })).status, 400, "listing reports need a target");
      const r = await call("POST", "/reports", { token: user, body: { category: "listing", targetListingId: listingId, subject: "Wrong price", message: "Owner asked for more." } });
      assert.equal(r.status, 201);
      reportId = r.body.report.id;
      assert.equal((await call("GET", "/admin/reports?status=open", { token: admin })).body.length, 1);
      assert.equal((await call("PATCH", `/admin/reports/${reportId}`, { token: admin, body: { status: "resolved" } })).status, 400, "resolving needs a note");
      await call("PATCH", `/admin/reports/${reportId}`, { token: admin, body: { status: "resolved", resolution: "Spoke with the owner; price corrected." } });
      const mine = await call("GET", "/reports/mine", { token: user });
      assert.equal(mine.body[0].status, "resolved");
      assert.equal((await call("GET", "/notifications", { token: user })).body.unread, 1);
    });

    await step("non-admins are locked out of admin routes", async () => {
      for (const t of [user, landlord, agent, realtor]) assert.equal((await call("GET", "/admin/stats", { token: t })).status, 403);
      assert.equal((await call("GET", "/admin/stats")).status, 401);
    });

    await step("suspension blocks access immediately and hides listings", async () => {
      const r = await call("PATCH", `/admin/people/${landlordId}/status`, { token: admin, body: { status: "suspended", reason: "Fake documents" } });
      assert.equal(r.status, 200);
      assert.equal((await call("GET", "/auth/me", { token: landlord })).status, 403, "existing token stops working");
      const login = await call("POST", "/auth/login", { body: { identifier: "landlord@test.dev", password: "password123" } });
      assert.equal(login.status, 403);
      assert.match(login.body.error, /Fake documents/);
      assert.equal((await call("GET", "/listings")).body.total, 0);
      assert.equal((await call("GET", `/listings/${listingId}`)).status, 404);
      await call("PATCH", `/admin/people/${landlordId}/status`, { token: admin, body: { status: "active" } });
      assert.equal((await call("GET", "/auth/me", { token: landlord })).status, 200);
    });

    await step("verification toggles and notifies", async () => {
      await call("PATCH", `/admin/people/${landlordId}/verification`, { token: admin, body: { verified: true } });
      assert.equal((await call("GET", "/auth/me", { token: landlord })).body.user.verified, true);
      const detail = await call("GET", `/admin/people/${landlordId}`, { token: admin });
      assert.equal(detail.body.listings.length, 1);
      assert.equal(detail.body.counts.inquiriesReceived, 1);
    });

    await step("removed listings can't be republished by the owner", async () => {
      assert.equal((await call("PATCH", `/admin/listings/${listingId}/status`, { token: admin, body: { status: "removed" } })).status, 400, "removal needs a note");
      await call("PATCH", `/admin/listings/${listingId}/status`, { token: admin, body: { status: "removed", note: "Duplicate listing" } });
      assert.equal((await call("PATCH", `/listings/${listingId}/status`, { token: landlord, body: { status: "active" } })).status, 409);
      const mine = await call("GET", "/listings/mine", { token: landlord });
      assert.equal(mine.body[0].moderationNote, "Duplicate listing");
    });

    await step("public stats only count what the public can see", async () => {
      const s = (await call("GET", "/public/stats")).body;
      assert.equal(s.liveListings, 0, "the only listing was removed");
      assert.equal(s.verifiedProfessionals, 1);
    });

    await step("public professional directory and profiles", async () => {
      const all = (await call("GET", "/professionals")).body;
      assert.equal(all.items[0].name, "landlord tester", "verified professionals are listed first");
      assert.equal(all.items[0].email, undefined, "directory never exposes email");
      assert.equal((await call("GET", "/professionals?role=agent&area=lekki")).body.total, 1);
      assert.equal((await call("GET", "/professionals?role=user")).body.total, 3, "invalid role filter falls back to all professionals");
      const profile = (await call("GET", `/professionals/${landlordId}`)).body;
      assert.equal(profile.profile.phone, "0800000000");
      assert.equal(profile.listings.length, 0, "removed listings are not shown");
      assert.equal((await call("GET", `/professionals/${userId}`)).status, 404, "members have no public profile");
    });

    await step("admin stats reflect the database", async () => {
      const s = (await call("GET", "/admin/stats", { token: admin })).body;
      assert.equal(s.totalMembers, 1);
      assert.equal(s.totalLandlords, 1);
      assert.equal(s.removedListings, 1);
      assert.equal(s.totalInquiries, 1);
      assert.equal(s.totalAgentRequests, 1);
      assert.equal(s.openReports, 0);
    });

    await step("self-deactivation requires the password and blocks sign-in", async () => {
      assert.equal((await call("POST", "/auth/me/deactivate", { token: realtor, body: { password: "nope" } })).status, 400);
      assert.equal((await call("POST", "/auth/me/deactivate", { token: realtor, body: { password: "password123" } })).status, 200);
      assert.equal((await call("GET", "/auth/me", { token: realtor })).status, 403);
    });

    await step("accounts created before statuses existed still count as active", async () => {
      const legacy = await User.collection.insertOne({ role: "landlord", name: "Legacy Owner", email: "legacy@test.dev", phone: "1", passwordHash: "x", verified: false, createdAt: new Date() });
      await mongoose.connection.collection("listings").insertOne({ landlordId: legacy.insertedId, title: "Legacy flat", description: "d", type: "rent", address: "a", location: "Yaba, Lagos", price: { currency: "₦", amount: 1 }, beds: 1, baths: 1, sqft: 1, status: "active", createdAt: new Date() });
      assert.equal((await call("GET", "/listings?q=legacy")).body.total, 1);
      assert.equal((await call("GET", "/admin/stats", { token: admin })).body.pendingApprovals, 2);
    });

    console.log(`\nAll ${passed} checks passed.`);
  } finally {
    await app.close();
    await rm(process.env.UPLOAD_DIR!, { recursive: true, force: true });
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log(`Dropped ${dbName}.`);
  }
}

main().catch((err) => {
  console.error(`\n✗ Failed after ${passed} passing checks:\n`, err);
  process.exit(1);
});
