import type { Role } from "@/lib/api";

export const DASHBOARD_ROUTE: Record<Role, string> = {
  user: "/dashboard",
  landlord: "/landlord-dashboard",
  agent: "/agent-dashboard",
  realtor: "/realtor-dashboard",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  user: "Member",
  landlord: "Landlord",
  agent: "Agent",
  realtor: "Realtor",
  admin: "Admin",
};

/** Roles that can publish and manage listings. */
export const LISTING_ROLES: Role[] = ["landlord", "agent", "realtor"];
