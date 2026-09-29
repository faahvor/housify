import type { Types } from "mongoose";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { emitToUser } from "../sockets/index.js";

export interface NotifyInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

export function toPublicNotification(n: any) {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
    read: !!n.readAt,
    createdAt: n.createdAt,
  };
}

/**
 * Stores a notification and pushes it to the user's open sessions.
 * Never throws — a failed notification must not fail the action that caused it.
 */
export async function notify(userId: string | Types.ObjectId | null | undefined, input: NotifyInput): Promise<void> {
  if (!userId) return;
  try {
    const doc = await Notification.create({ userId, ...input });
    emitToUser(String(userId), "notification", toPublicNotification(doc));
  } catch (err) {
    console.error("Failed to create notification", err);
  }
}

export async function notifyAdmins(input: NotifyInput): Promise<void> {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await Promise.all(admins.map((a) => notify(a._id, input)));
}

/** Where each role manages things, for notification links. */
export const DASHBOARD_BASE: Record<string, string> = {
  user: "/dashboard",
  landlord: "/landlord-dashboard",
  agent: "/agent-dashboard",
  realtor: "/realtor-dashboard",
  admin: "/admin",
};
