"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building, Globe, LifeBuoy, Loader2, LogOut, Moon, Plus } from "lucide-react";
import { useAppStore, type UserRole } from "@/lib/store";
import { DASHBOARD_ROUTE } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { DashboardRail, DashboardTabBar } from "@/components/dashboards/dashboard-rail";
import { DashboardTopbar } from "@/components/dashboards/dashboard-topbar";
import { CommandPalette, type CommandItem } from "@/components/dashboards/command-palette";
import { isNavActive, type DashboardNavItem } from "@/components/dashboards/types";

export type { DashboardNavItem };

interface DashboardShellProps {
  role: Exclude<UserRole, null>;
  navItems: DashboardNavItem[];
  roleLabel: string;
  profileHref: string;
  children: React.ReactNode;
}

const LISTING_ROLES: UserRole[] = ["landlord", "agent", "realtor"];

export function DashboardShell({ role, navItems, roleLabel, profileHref, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentRole = useAppStore((s) => s.role);
  const loggedIn = useAppStore((s) => s.loggedIn);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const railExpanded = useAppStore((s) => s.railExpanded);
  const logOut = useAppStore((s) => s.logOut);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const queryClient = useQueryClient();

  const authorized = hasHydrated && currentRole === role && loggedIn;

  useEffect(() => {
    if (!hasHydrated || (currentRole === role && loggedIn)) return;
    // Signed in with another role → their own dashboard; signed out → sign in and come back.
    if (loggedIn && currentRole) router.replace(DASHBOARD_ROUTE[currentRole]);
    else router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [hasHydrated, currentRole, loggedIn, role, router, pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    logOut();
    queryClient.clear();
    router.push("/");
  }

  const pageTitle = navItems.find((item) => isNavActive(pathname, item.href, item.exact))?.label ?? roleLabel;

  const commands = useMemo<CommandItem[]>(() => {
    const nav: CommandItem[] = navItems.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: "Go to",
      icon: item.icon,
      href: item.href,
    }));
    const actions: CommandItem[] = [
      ...(LISTING_ROLES.includes(role)
        ? [{ id: "new-listing", label: "Create a new listing", group: "Actions", icon: Plus, href: `${DASHBOARD_ROUTE[role]}/listings/new`, keywords: "add property" }]
        : []),
      { id: "browse", label: "Browse properties", group: "Actions", icon: Building, href: "/browse", keywords: "search homes" },
      ...(role !== "admin"
        ? [{ id: "support", label: "Report a problem or contact support", group: "Actions", icon: LifeBuoy, href: `${DASHBOARD_ROUTE[role]}/support`, keywords: "complaint query report help" }]
        : []),
      { id: "theme", label: "Toggle dark mode", group: "Preferences", icon: Moon, run: toggleTheme, keywords: "light theme" },
      { id: "site", label: "Go to Housify homepage", group: "Preferences", icon: Globe, href: "/" },
      { id: "logout", label: "Log out", group: "Account", icon: LogOut, run: handleLogout, keywords: "sign out" },
    ];
    return [...nav, ...actions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems, role, toggleTheme]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <LogoMark className="size-10 animate-pulse" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Checking your session…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-aurora">
      <DashboardRail navItems={navItems} workspaceLabel={`${roleLabel} workspace`} />
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300 ease-out", railExpanded ? "lg:pl-[248px]" : "lg:pl-[76px]")}>
        <DashboardTopbar
          pageTitle={pageTitle}
          roleLabel={roleLabel}
          profileHref={profileHref}
          supportHref={role === "admin" ? undefined : `${DASHBOARD_ROUTE[role]}/support`}
          onOpenSearch={() => setPaletteOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-16">{children}</main>
      </div>
      <DashboardTabBar navItems={navItems} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={commands} />
    </div>
  );
}
