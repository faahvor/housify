import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-grid-ink flex flex-wrap items-center justify-between gap-4 border-t border-gold/30 px-6 py-10 sm:px-10">
      <div className="text-xs text-offwhite/55">© 2026 Prestige Homes. All rights reserved.</div>
      <div className="flex flex-wrap gap-6 text-xs tracking-wide">
        <Link href="/search" className="text-offwhite/70 hover:text-gold transition-colors">
          Listings
        </Link>
        <Link href="/list-property" className="text-offwhite/70 hover:text-gold transition-colors">
          List Your Property
        </Link>
        <Link href="/become-agent" className="text-offwhite/70 hover:text-gold transition-colors">
          Become an Agent
        </Link>
        <a
          href="mailto:hello@prestigehomes.example"
          className="text-offwhite/70 hover:text-gold transition-colors"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
