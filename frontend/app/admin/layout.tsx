"use client";

import { Activity, Building2, Flag, LayoutGrid, Settings, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboards/dashboard-shell";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/reports", label: "Reports", icon: Flag, exact: false },
  { href: "/admin/people", label: "People", icon: Users, exact: false },
  { href: "/admin/listings", label: "Listings", icon: Building2, exact: false },
  { href: "/admin/activity", label: "Activity", icon: Activity, exact: false },
  { href: "/admin/profile", label: "Settings", icon: Settings, exact: false },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="admin" navItems={NAV_ITEMS} roleLabel="Admin" profileHref="/admin/profile">
      {children}
    </DashboardShell>
  );
}
