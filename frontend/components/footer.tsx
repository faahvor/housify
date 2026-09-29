import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Find a home",
    links: [
      { label: "Homes to rent", href: "/browse?type=rent" },
      { label: "Homes for sale", href: "/browse?type=sale" },
      { label: "Furnished & shortlets", href: "/browse?furnished=true" },
      { label: "Land & plots", href: "/browse?propertyType=land" },
    ],
  },
  {
    title: "Popular areas",
    links: [
      { label: "Lekki", href: "/browse?location=Lekki" },
      { label: "Ikoyi", href: "/browse?location=Ikoyi" },
      { label: "Victoria Island", href: "/browse?location=Victoria%20Island" },
      { label: "Maitama, Abuja", href: "/browse?location=Maitama" },
    ],
  },
  {
    title: "For professionals",
    links: [
      { label: "List your property", href: "/list-property" },
      { label: "Join as a landlord", href: "/join?role=landlord" },
      { label: "Join as an agent", href: "/join?role=agent" },
      { label: "Join as a realtor", href: "/join?role=realtor" },
    ],
  },
  {
    title: "Housify",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Create an account", href: "/join" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-5 pt-16 pb-10 sm:px-8">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nigeria&apos;s direct property marketplace. Rent or buy from landlords, and work with verified agents and realtors across
              Lagos, Abuja and Port Harcourt.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 font-sans text-sm font-semibold tracking-normal">{col.title}</h3>
                <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Housify. All rights reserved.</span>
          <span>Area and lifestyle photography via Unsplash and Pexels. Listing photos are supplied by their owners.</span>
        </div>
      </div>
    </footer>
  );
}
