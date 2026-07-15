import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { signToken } from "./jwt.js";

interface RegisterBody {
  role: "landlord" | "agent";
  name: string;
  email: string;
  password: string;
  phone: string;
  whatsapp?: string;
  bio?: string;
  areasCovered?: string[];
  experience?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { role, name, email, password, phone, whatsapp, bio, areasCovered, experience } =
      request.body;

    if (!role || !name || !email || !password || !phone) {
      return reply.code(400).send({ error: "Missing required fields." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
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
      whatsapp,
      bio,
      areasCovered: role === "agent" ? areasCovered : undefined,
      experience: role === "agent" ? experience : undefined,
    });

    const token = signToken({ sub: user.id, role: user.role as "landlord" | "agent" });
    return reply.code(201).send({ token, user: toPublicUser(user) });
  });

  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid email or password." });
    }

    const token = signToken({ sub: user.id, role: user.role as "landlord" | "agent" });
    return reply.send({ token, user: toPublicUser(user) });
  });
}

function toPublicUser(user: any) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    whatsapp: user.whatsapp,
    bio: user.bio,
    verified: user.verified,
    avatarUrl: user.avatarUrl,
    areasCovered: user.areasCovered,
    experience: user.experience,
  };
}
