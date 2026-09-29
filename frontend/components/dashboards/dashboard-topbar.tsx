"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, Globe, LifeBuoy, LogOut, Moon, Search, Sun, UserRound } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/brand/logo";
import { NotificationsBell } from "@/components/dashboards/notifications-bell";
import { useMe } from "@/components/dashboards/account-status";

interface TopbarProps {
  pageTitle: string;
  roleLabel: string;
  profileHref: string;
  supportHref?: string;
  onOpenSearch: () => void;
  onLogout: () => void;
}

function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return mac;
}

const iconButton =
  "flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

const menuItem =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/85 outline-none select-none data-[highlighted]:bg-secondary data-[highlighted]:text-foreground";

export function DashboardTopbar({ pageTitle, roleLabel, profileHref, supportHref, onOpenSearch, onLogout }: TopbarProps) {
  const user = useAppStore((s) => s.user);
  const { data: me } = useMe();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isMac = useIsMac();
  const displayName = user?.name?.trim() || roleLabel;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="lg:hidden" aria-label="Housify home">
          <Logo compact />
        </Link>

        <div className="min-w-0 flex-1 lg:flex-none">
          <div className="text-[11px] font-medium text-muted-foreground">{roleLabel} workspace</div>
          <div className="truncate font-display text-[15px] font-semibold tracking-[-0.02em]">{pageTitle}</div>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="mx-auto hidden h-10 w-full max-w-[420px] cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 text-sm text-muted-foreground shadow-soft transition-colors hover:border-primary/30 hover:text-foreground md:flex"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-medium">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>

        <div className="flex items-center gap-1">
          <button type="button" onClick={onOpenSearch} aria-label="Search" className={`${iconButton} md:hidden`}>
            <Search className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={iconButton}
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <NotificationsBell />

          <Menu.Root>
            <Menu.Trigger
              aria-label="Account menu"
              className="ml-1 flex cursor-pointer items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:pr-2"
            >
              <Avatar name={user?.name} src={me?.avatarUrl} size={32} />
              <span className="hidden max-w-[140px] truncate text-sm font-medium sm:block">{displayName}</span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={8} className="z-50">
                <Menu.Popup className="w-60 origin-[var(--transform-origin)] rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                  <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
                    <Avatar name={user?.name} src={me?.avatarUrl} size={36} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{user?.email || roleLabel}</div>
                    </div>
                  </div>
                  <div className="-mx-1.5 mb-1.5 h-px bg-border" />
                  <Menu.LinkItem className={menuItem} render={<Link href={profileHref} />}>
                    <UserRound className="size-4 text-muted-foreground" />
                    Profile & settings
                  </Menu.LinkItem>
                  {supportHref && (
                    <Menu.LinkItem className={menuItem} render={<Link href={supportHref} />}>
                      <LifeBuoy className="size-4 text-muted-foreground" />
                      Support & reports
                    </Menu.LinkItem>
                  )}
                  <Menu.LinkItem className={menuItem} render={<Link href="/" />}>
                    <Globe className="size-4 text-muted-foreground" />
                    Go to Housify
                  </Menu.LinkItem>
                  <div className="-mx-1.5 my-1.5 h-px bg-border" />
                  <Menu.Item className={`${menuItem} text-destructive data-[highlighted]:text-destructive`} onClick={onLogout}>
                    <LogOut className="size-4" />
                    Log out
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </header>
  );
}
