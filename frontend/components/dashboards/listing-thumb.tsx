import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Listing photo, or a branded placeholder when the landlord hasn't uploaded one. */
export function ListingThumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading="lazy" className={cn("shrink-0 rounded-xl object-cover", className)} />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-highlight/10 text-primary/70",
        className
      )}
    >
      <Building2 className="size-1/2 max-h-6 max-w-6" strokeWidth={1.6} />
    </div>
  );
}
