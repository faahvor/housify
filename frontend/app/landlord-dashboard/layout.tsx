"use client";

import { Building2, LayoutGrid, MessageSquare, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboards/dashboard-shell";

const NAV_ITEMS = [
  { href: "/landlord-dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/landlord-dashboard/listings", label: "Listings", icon: Building2, exact: false },
  { href: "/landlord-dashboard/inquiries", label: "Inquiries", icon: MessageSquare, exact: false },
  { href: "/landlord-dashboard/profile", label: "Profile", icon: UserRound, exact: false },
];

export default function LandlordDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="landlord" navItems={NAV_ITEMS} roleLabel="Landlord" profileHref="/landlord-dashboard/profile">
      {children}
    </DashboardShell>
  );
}
