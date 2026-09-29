"use client";

import { Heart, LayoutGrid, LifeBuoy, MessageSquare, UserRound, UserRoundSearch } from "lucide-react";
import { DashboardShell } from "@/components/dashboards/dashboard-shell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/saved", label: "Saved", icon: Heart, exact: false },
  { href: "/dashboard/inquiries", label: "Inquiries", icon: MessageSquare, exact: false },
  { href: "/dashboard/requests", label: "Agents", icon: UserRoundSearch, exact: false },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy, exact: false },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound, exact: false },
];

export default function MemberDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="user" navItems={NAV_ITEMS} roleLabel="Member" profileHref="/dashboard/profile">
      {children}
    </DashboardShell>
  );
}
