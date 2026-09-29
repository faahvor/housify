"use client";

import { Building2, Inbox, LayoutGrid, MessageSquare, UserRound, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboards/dashboard-shell";

const NAV_ITEMS = [
  { href: "/agent-dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/agent-dashboard/requests", label: "Requests", icon: Inbox, exact: false },
  { href: "/agent-dashboard/clients", label: "Clients", icon: Users, exact: false },
  { href: "/agent-dashboard/listings", label: "Listings", icon: Building2, exact: false },
  { href: "/agent-dashboard/inquiries", label: "Inquiries", icon: MessageSquare, exact: false },
  { href: "/agent-dashboard/profile", label: "Profile", icon: UserRound, exact: false },
];

export default function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="agent" navItems={NAV_ITEMS} roleLabel="Agent" profileHref="/agent-dashboard/profile">
      {children}
    </DashboardShell>
  );
}
