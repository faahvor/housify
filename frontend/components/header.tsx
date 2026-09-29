"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const PUBLIC_NAV_ITEMS = [
  { label: "Browse", href: "/browse" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Join", href: "/join" },
  { label: "Sign in", href: "/sign-in" },
];

const ROLE_NAV_ITEMS: Record<"user" | "landlord" | "agent" | "realtor" | "admin", { label: string; href: string }[]> = {
  user: [
    { label: "Browse", href: "/browse" },
    { label: "Saved", href: "/dashboard/saved" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  landlord: [
    { label: "Dashboard", href: "/landlord-dashboard" },
    { label: "Listings", href: "/landlord-dashboard/listings" },
    { label: "Inquiries", href: "/landlord-dashboard/inquiries" },
  ],
  realtor: [
    { label: "Dashboard", href: "/realtor-dashboard" },
    { label: "Listings", href: "/realtor-dashboard/listings" },
    { label: "Inquiries", href: "/realtor-dashboard/inquiries" },
  ],
  agent: [
    { label: "Dashboard", href: "/agent-dashboard" },
    { label: "Requests", href: "/agent-dashboard/requests" },
    { label: "Clients", href: "/agent-dashboard/clients" },
  ],
  admin: [{ label: "Dashboard", href: "/admin" }],
};

interface HeaderProps {
  /** Transparent with light text over a full-bleed hero; turns solid on scroll. */
  overlay?: boolean;
}

export function Header({ overlay = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAppStore((s) => s.role);
  const loggedIn = useAppStore((s) => s.loggedIn);
  const logOut = useAppStore((s) => s.logOut);
  const queryClient = useQueryClient();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isAuthedRole = loggedIn && role !== null;
  const navItems = isAuthedRole && role ? ROLE_NAV_ITEMS[role] : PUBLIC_NAV_ITEMS;
  // Light-on-photo styling only while the header floats over the hero.
  const onPhoto = overlay && !scrolled && !mobileOpen;

  function handleLogout() {
    setMobileOpen(false);
    logOut();
    queryClient.clear();
    router.push("/");
  }

  const iconBtn = cn(
    "flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors",
    onPhoto ? "text-white/85 hover:bg-white/15 hover:text-white" : "text-foreground/75 hover:bg-secondary hover:text-foreground"
  );

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        overlay ? "fixed" : "sticky",
        onPhoto
          ? "border-b border-transparent bg-transparent"
          : cn("border-b bg-background/85 backdrop-blur-xl", scrolled ? "border-border shadow-[0_8px_30px_-12px_rgba(11,13,18,0.18)]" : "border-transparent")
      )}
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Housify home">
          <Logo tone={onPhoto ? "light" : "default"} />
        </Link>

        <nav aria-label="Main" className={cn("hidden items-center gap-8 text-sm font-medium lg:flex", onPhoto ? "text-white/85" : "text-foreground/75")}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn("relative whitespace-nowrap transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all hover:after:w-full", onPhoto ? "hover:text-white" : "hover:text-foreground")}
            >
              {item.label}
            </Link>
          ))}
          {isAuthedRole && (
            <button onClick={handleLogout} className={cn("cursor-pointer whitespace-nowrap transition-colors", onPhoto ? "hover:text-white" : "hover:text-foreground")}>
              Log out
            </button>
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className={iconBtn}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            href="/list-property"
            className={cn(
              "inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-all hover:-translate-y-px",
              onPhoto ? "bg-white text-[#0b0d12] hover:bg-white/90" : "bg-primary text-primary-foreground shadow-glow hover:brightness-110"
            )}
          >
            List your property
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className={iconBtn}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={iconBtn}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t border-border bg-background px-5 py-4 duration-200 lg:hidden">
          <nav aria-label="Main" className="flex flex-col gap-1 text-sm font-medium text-foreground/80">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 transition-colors hover:bg-secondary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            {isAuthedRole && (
              <button onClick={handleLogout} className="cursor-pointer rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary hover:text-primary">
                Log out
              </button>
            )}
          </nav>
          <Link
            href="/list-property"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex items-center justify-center rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            List your property
          </Link>
        </div>
      )}
    </header>
  );
}
