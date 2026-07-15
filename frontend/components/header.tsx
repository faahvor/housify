"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Browse", href: "/" },
  { label: "List Your Property", href: "/list-property" },
  { label: "Become an Agent", href: "/become-agent" },
  { label: "Sign In", href: "/sign-in" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors duration-300 sm:px-10 sm:py-6 ${
        scrolled ? "bg-ink" : "bg-transparent"
      }`}
    >
      <Link
        href="/"
        className="flex items-baseline gap-1.5 font-display text-lg font-semibold tracking-tight text-cream sm:text-[22px]"
      >
        <span>Prestige</span>
        <span className="italic text-gold">Homes</span>
      </Link>

      <nav className="flex items-center gap-3.5 text-[10px] uppercase tracking-[0.1em] text-cream/85 sm:gap-6 sm:text-xs">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} href={item.href} className="whitespace-nowrap hover:text-gold transition-colors">
            <span className="sm:hidden">
              {item.label === "List Your Property"
                ? "List"
                : item.label === "Become an Agent"
                  ? "Agent"
                  : item.label}
            </span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
        <a
          href="mailto:hello@prestigehomes.example"
          className="whitespace-nowrap hover:text-gold transition-colors"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
