import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { User, PUBLIC_ROLES, type Role } from "../models/User.js";
import { signToken } from "./jwt.js";
import { requireAuth } from "./middleware.js";
import { email as emailField, oneOf, requiredStr, str, strList } from "../lib/validate.js";
import { notifyAdmins } from "../notifications/service.js";
import { isOwnUpload } from "../uploads/routes.js";

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

    const token = signToken({ sub: user.id, role: user.role as Role });
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

    const token = signToken({ sub: user.id, role: user.role as Role });
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
    await user.save();
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
