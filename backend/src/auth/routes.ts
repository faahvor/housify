import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { User, PUBLIC_ROLES, type Role } from "../models/User.js";
import { signToken } from "./jwt.js";
import { requireAuth } from "./middleware.js";
import { email as emailField, oneOf, requiredStr, str, strList } from "../lib/validate.js";
import { notifyAdmins } from "../notifications/service.js";
import { isOwnUpload } from "../uploads/routes.js";
import { createHash, randomBytes } from "node:crypto";
import { PasswordReset } from "../models/PasswordReset.js";
import { sendInBackground } from "../mail/index.js";
import { passwordChangedEmail, passwordResetEmail } from "../mail/templates.js";
import { env } from "../config/env.js";
import { notify, DASHBOARD_BASE } from "../notifications/service.js";

const RESET_MINUTES = 30;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const tokenFor = (user: { _id: unknown; role: unknown; tokenVersion?: number | null }) =>
  signToken({ sub: String(user._id), role: user.role as Role, ver: user.tokenVersion ?? 0 });

/** t***@gmail.com — enough to recognise, not enough to harvest. */
function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
}

/** Looks up an unused, unexpired reset by its raw token. */
async function findLiveReset(token: unknown) {
  if (typeof token !== "string" || token.length < 32 || token.length > 128) return null;
  return PasswordReset.findOne({ tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } });
}

const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", authRateLimit, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    // Only public roles can be self-registered — never "admin".
    const role = oneOf(body.role, PUBLIC_ROLES, "Role")!;
    const name = requiredStr(body.name, "Name", 100);
    const email = emailField(body.email)!;
    const password = requiredStr(body.password, "Password", 200);
    if (password.length < 8) {
      return reply.code(400).send({ error: "Password must be at least 8 characters." });
    }
    const phone = str(body.phone, "Phone", { required: role !== "user", max: 30 });
    const professional = role !== "user";

    const existing = await User.findOne({ email });
    if (existing) {
      return reply.code(409).send({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      role,
      name,
      email,
      passwordHash,
      phone,
      whatsapp: str(body.whatsapp, "WhatsApp", { max: 30 }),
      bio: professional ? str(body.bio, "Bio", { max: 2000 }) : undefined,
      states: professional ? strList(body.states, "States") : undefined,
      areasCovered: professional ? strList(body.areasCovered, "Areas", 200) : undefined,
      experience: role === "agent" || role === "realtor" ? str(body.experience, "Experience", { max: 2000 }) : undefined,
      // Renters/buyers don't go through professional verification.
      verified: role === "user",
    });

    if (professional) {
      await notifyAdmins({
        type: "account.pending_verification",
        title: `New ${role} awaiting verification`,
        body: `${name} just joined as a ${role}.`,
        link: `/admin/people/${user.id}`,
      });
    }

    const token = tokenFor(user);
    return reply.code(201).send({ token, user: toPublicUser(user) });
  });

  app.post("/auth/login", authRateLimit, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const identifier = requiredStr(body.identifier, "Email or username", 254).toLowerCase();
    const password = requiredStr(body.password, "Password", 200);

    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      return reply.code(401).send({ error: "Incorrect email or password." });
    }
    if (user.status === "suspended") {
      return reply.code(403).send({
        error: `This account has been suspended${user.statusReason ? `: ${user.statusReason}` : "."} Contact Housify support if you think this is a mistake.`,
        code: "ACCOUNT_BLOCKED",
      });
    }
    if (user.status === "deactivated") {
      return reply.code(403).send({ error: "This account has been deactivated.", code: "ACCOUNT_BLOCKED" });
    }

    const token = tokenFor(user);
    return reply.send({ token, user: toPublicUser(user) });
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = await User.findById(request.authUser!.sub);
    if (!user) {
      return reply.code(404).send({ error: "User not found." });
    }
    return { user: toPublicUser(user) };
  });

  app.patch("/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const user = await User.findById(request.authUser!.sub);
    if (!user) {
      return reply.code(404).send({ error: "User not found." });
    }
    const professional = ["landlord", "agent", "realtor"].includes(user.role);

    if (body.username !== undefined) {
      const username = str(body.username, "Username", { max: 40 })?.toLowerCase();
      if (username && username !== user.username) {
        if (!/^[a-z0-9_.]{3,40}$/.test(username)) {
          return reply.code(400).send({ error: "Usernames can only use letters, numbers, dots and underscores." });
        }
        if (await User.exists({ username })) {
          return reply.code(409).send({ error: "That username is already taken." });
        }
        user.username = username;
      }
    }
    if (body.email !== undefined && user.role !== "admin") {
      const email = emailField(body.email)!;
      if (email !== user.email) {
        if (await User.exists({ email })) {
          return reply.code(409).send({ error: "An account with that email already exists." });
        }
        user.email = email;
      }
    }
    if (body.name !== undefined) user.name = requiredStr(body.name, "Name", 100);
    if (body.phone !== undefined) {
      const phone = str(body.phone, "Phone", { max: 30, required: professional });
      user.phone = phone ?? undefined;
    }
    if (body.whatsapp !== undefined) user.whatsapp = str(body.whatsapp, "WhatsApp", { max: 30 }) ?? undefined;
    if (body.bio !== undefined) user.bio = str(body.bio, "Bio", { max: 2000 }) ?? undefined;
    if (body.avatarUrl !== undefined) {
      const avatarUrl = str(body.avatarUrl, "Profile photo", { max: 2048 });
      if (avatarUrl && !(await isOwnUpload(avatarUrl, user.id, "avatar"))) {
        return reply.code(400).send({ error: "Upload your profile photo first." });
      }
      user.avatarUrl = avatarUrl ?? undefined;
    }
    if (professional) {
      if (body.states !== undefined) user.states = strList(body.states, "States") ?? [];
      if (body.areasCovered !== undefined) user.areasCovered = strList(body.areasCovered, "Areas", 200) ?? [];
      if (body.experience !== undefined) user.experience = str(body.experience, "Experience", { max: 2000 }) ?? undefined;
    }

    await user.save();
    return { user: toPublicUser(user) };
  });

  app.patch("/auth/me/password", { preHandler: requireAuth, ...authRateLimit }, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const currentPassword = requiredStr(body.currentPassword, "Current password", 200);
    const newPassword = requiredStr(body.newPassword, "New password", 200);
    if (newPassword.length < 8) {
      return reply.code(400).send({ error: "New password must be at least 8 characters." });
    }

    const user = await User.findById(request.authUser!.sub);
    if (!user) {
      return reply.code(404).send({ error: "User not found." });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return reply.code(400).send({ error: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Sign out every other device; this one gets a fresh token below.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    if (user.email) {
      sendInBackground(passwordChangedEmail({ to: user.email, name: user.name, signInUrl: `${env.webOrigin}/sign-in` }), (err) => request.log.error(err));
    }
    return { ok: true, token: tokenFor(user) };
  });

  /* ───────── Password reset ───────── */

  // Always answers the same way, whether or not the email has an account.
  app.post("/auth/forgot-password", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (request) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = emailField(body.email)!;
    const generic = { ok: true, message: "If an account uses that email, we've sent a link to reset the password." };

    const user = await User.findOne({ email, role: { $ne: "admin" } });
    if (!user || !user.email) return generic;

    // Only the newest link works.
    await PasswordReset.deleteMany({ userId: user._id, usedAt: null });
    const token = randomBytes(32).toString("base64url");
    await PasswordReset.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
      requestIp: request.ip,
    });
    const link = `${env.webOrigin}/reset-password?token=${encodeURIComponent(token)}`;
    sendInBackground(passwordResetEmail({ to: user.email, name: user.name, link, minutes: RESET_MINUTES }), (err) => request.log.error(err));
    return generic;
  });

  // Lets the reset page say "this link has expired" before asking for a password.
  app.post("/auth/reset-password/check", { config: { rateLimit: { max: 20, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const reset = await findLiveReset((request.body as Record<string, unknown> | undefined)?.token);
    if (!reset) return reply.code(400).send({ error: "This reset link is invalid or has expired.", code: "RESET_INVALID" });
    const user = await User.findById(reset.userId).select("email").lean();
    return { ok: true, email: user?.email ? maskEmail(user.email) : null, expiresAt: reset.expiresAt };
  });

  app.post("/auth/reset-password", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const password = requiredStr(body.password, "New password", 200);
    if (password.length < 8) return reply.code(400).send({ error: "Password must be at least 8 characters." });

    const reset = await findLiveReset(body.token);
    if (!reset) return reply.code(400).send({ error: "This reset link is invalid or has expired.", code: "RESET_INVALID" });

    // Claim the link atomically so two submissions can't both use it.
    const claimed = await PasswordReset.findOneAndUpdate({ _id: reset._id, usedAt: null }, { usedAt: new Date() });
    if (!claimed) return reply.code(400).send({ error: "This reset link has already been used.", code: "RESET_INVALID" });

    const user = await User.findById(reset.userId);
    if (!user) return reply.code(400).send({ error: "This reset link is invalid or has expired.", code: "RESET_INVALID" });
    user.passwordHash = await bcrypt.hash(password, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1; // signs out every device
    await user.save();
    await PasswordReset.deleteMany({ userId: user._id, usedAt: null });

    await notify(user._id, {
      type: "account.password_reset",
      title: "Your password was reset",
      body: "If this wasn't you, contact the Housify team right away.",
      link: `${DASHBOARD_BASE[user.role]}/profile`,
    });
    if (user.email) {
      sendInBackground(passwordChangedEmail({ to: user.email, name: user.name, signInUrl: `${env.webOrigin}/sign-in` }), (err) => request.log.error(err));
    }
    return { ok: true };
  });

  // Self-service deactivation. Admins reactivate if the person changes their mind.
  app.post("/auth/me/deactivate", { preHandler: requireAuth }, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const password = requiredStr(body.password, "Password", 200);
    const user = await User.findById(request.authUser!.sub);
    if (!user) return reply.code(404).send({ error: "User not found." });
    if (user.role === "admin") return reply.code(400).send({ error: "Admin accounts can't be deactivated here." });
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(400).send({ error: "Password is incorrect." });
    }
    user.status = "deactivated";
    user.statusReason = "Deactivated by the account owner.";
    user.statusChangedAt = new Date();
    await user.save();
    return { ok: true };
  });
}

export function toPublicUser(user: any) {
  return {
    id: String(user._id ?? user.id),
    role: user.role,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    whatsapp: user.whatsapp,
    bio: user.bio,
    verified: user.verified,
    status: user.status ?? "active",
    avatarUrl: user.avatarUrl,
    states: user.states ?? [],
    areasCovered: user.areasCovered ?? [],
    experience: user.experience,
    createdAt: user.createdAt,
  };
}
