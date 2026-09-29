"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@base-ui/react/tooltip";
import { ArrowUpRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { isNavActive, type DashboardNavItem } from "@/components/dashboards/types";

interface RailProps {
  navItems: DashboardNavItem[];
  workspaceLabel: string;
}

function RailTooltip({ label, enabled, children }: { label: string; enabled: boolean; children: React.ReactElement }) {
  if (!enabled) return children;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={12}>
          <Tooltip.Popup className="rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Desktop icon rail. Collapsed shows icons with tooltips; expanded shows labels. */
export function DashboardRail({ navItems, workspaceLabel }: RailProps) {
  const pathname = usePathname();
  const expanded = useAppStore((s) => s.railExpanded);
  const toggleRail = useAppStore((s) => s.toggleRail);
  const collapsed = !expanded;

  return (
    <Tooltip.Provider delay={150}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
          expanded ? "w-[248px]" : "w-[76px]"
        )}
      >
        <div className={cn("flex h-16 items-center", expanded ? "px-5" : "justify-center")}>
          <Link href="/" aria-label="Housify home">
            <Logo compact={collapsed} />
          </Link>
        </div>

        <div className={cn("mt-4 mb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase", expanded ? "px-6" : "sr-only")}>
          {workspaceLabel}
        </div>

        <nav aria-label="Dashboard" className={cn("flex flex-1 flex-col gap-1", expanded ? "px-3" : "items-center px-2")}>
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <RailTooltip key={item.href} label={item.label} enabled={collapsed}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex h-11 items-center rounded-xl text-sm font-medium transition-colors",
                    expanded ? "w-full gap-3 px-3" : "w-11 justify-center",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute top-1/2 -left-2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                  )}
                  <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
                  {expanded && <span className="truncate">{item.label}</span>}
                </Link>
              </RailTooltip>
            );
          })}
        </nav>

        <div className={cn("flex flex-col gap-1 border-t border-sidebar-border py-4", expanded ? "px-3" : "items-center px-2")}>
          <RailTooltip label="Back to site" enabled={collapsed}>
            <Link
              href="/"
              aria-label={collapsed ? "Back to site" : undefined}
              className={cn(
                "flex h-10 items-center rounded-xl text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                expanded ? "w-full gap-3 px-3" : "w-11 justify-center"
              )}
            >
              <ArrowUpRight className="size-[18px] shrink-0" strokeWidth={1.9} />
              {expanded && "Back to site"}
            </Link>
          </RailTooltip>
          <RailTooltip label="Expand sidebar" enabled={collapsed}>
            <button
              type="button"
              onClick={toggleRail}
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={expanded}
              className={cn(
                "flex h-10 cursor-pointer items-center rounded-xl text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                expanded ? "w-full gap-3 px-3" : "w-11 justify-center"
              )}
            >
              {expanded ? (
                <PanelLeftClose className="size-[18px] shrink-0" strokeWidth={1.9} />
              ) : (
                <PanelLeftOpen className="size-[18px] shrink-0" strokeWidth={1.9} />
              )}
              {expanded && "Collapse"}
            </button>
          </RailTooltip>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}

/** Mobile bottom tab bar — the rail's counterpart below the lg breakpoint. */
export function DashboardTabBar({ navItems }: { navItems: DashboardNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[10.5px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
