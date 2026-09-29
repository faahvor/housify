import Link from "next/link";
import { BadgeCheck, Bath, BedDouble, Building2, MapPin, Maximize } from "lucide-react";
import type { Listing } from "@/lib/api";
import { formatListingPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<Listing["propertyType"], string> = {
  apartment: "Apartment",
  house: "House",
  duplex: "Duplex",
  shortlet: "Shortlet",
  land: "Land",
  commercial: "Commercial",
  other: "Property",
};

/**
 * Public listing card. Photos come only from what the owner uploaded;
 * listings without photos get a branded placeholder.
 */
export function ListingCard({ listing, className }: { listing: Listing; className?: string }) {
  const photo = listing.photos[0];
  const isLand = listing.propertyType === "land";

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(11,13,18,0.35)]", className)}>
      <Link href={`/listings/${listing.id}`} className="absolute inset-0 z-10" aria-label={listing.title} />
      <div className="relative aspect-[4/3] overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 via-primary/5 to-highlight/15 text-primary/70">
            <Building2 className="size-10" strokeWidth={1.4} />
            <span className="text-xs font-medium text-muted-foreground">Photos coming soon</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {listing.type === "rent" ? "For rent" : "For sale"}
          </span>
          {listing.furnished && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0b0d12]">Furnished</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xl font-semibold tracking-[-0.02em] tabular-nums">{formatListingPrice(listing)}</span>
          {listing.negotiable && <span className="text-[11px] font-medium text-success">Negotiable</span>}
        </div>
        <h3 className="mt-1 line-clamp-1 font-sans text-[15px] font-semibold tracking-normal">{listing.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/80">{TYPE_LABEL[listing.propertyType]}</span>
          {!isLand && (
            <>
              <span className="flex items-center gap-1"><BedDouble className="size-4" /> {listing.beds}</span>
              <span className="flex items-center gap-1"><Bath className="size-4" /> {listing.baths}</span>
            </>
          )}
          {listing.sqft > 0 && <span className="flex items-center gap-1"><Maximize className="size-3.5" /> {listing.sqft.toLocaleString()} ft²</span>}
        </div>

        {listing.owner && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            Listed by <span className="font-medium text-foreground/80">{listing.owner.name}</span>
            {listing.owner.verified && <BadgeCheck className="size-3.5 text-primary" aria-label="Verified" />}
          </div>
        )}
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-secondary" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-1/2 animate-pulse rounded-lg bg-secondary" />
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-secondary" />
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-secondary" />
      </div>
    </div>
  );
}
