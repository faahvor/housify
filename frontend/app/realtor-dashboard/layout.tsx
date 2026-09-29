"use client";

import { Building2, LayoutGrid, MessageSquare, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboards/dashboard-shell";

const NAV_ITEMS = [
  { href: "/realtor-dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/realtor-dashboard/listings", label: "Listings", icon: Building2, exact: false },
  { href: "/realtor-dashboard/inquiries", label: "Inquiries", icon: MessageSquare, exact: false },
  { href: "/realtor-dashboard/profile", label: "Profile", icon: UserRound, exact: false },
];

export default function RealtorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="realtor" navItems={NAV_ITEMS} roleLabel="Realtor" profileHref="/realtor-dashboard/profile">
      {children}
    </DashboardShell>
  );
}
