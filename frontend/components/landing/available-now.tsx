"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { LISTINGS, img, priceLabel } from "@/lib/mock-data";

export function AvailableNow() {
  const rowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function scrollBy(delta: number) {
    rowRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="bg-grid-cream relative py-[100px] sm:py-[120px]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-5 px-6 pb-12 sm:px-10">
        <div>
          <div className="mb-3.5 font-display text-[15px] italic text-burgundy">Available now</div>
          <div className="max-w-[700px] font-display text-[30px] leading-[1.05] font-semibold sm:text-[40px] lg:text-[52px]">
            A first look, <span className="italic text-gold">before</span> you choose a path.
          </div>
        </div>
        <div className="max-w-[320px] text-[13px] leading-relaxed opacity-60">
          Hover any residence to watch it unfold. Every home here is live, direct from its landlord.
        </div>
      </div>

      <div className="relative">
        <div
          ref={rowRef}
          className="scrollbar-none flex gap-6 overflow-x-auto px-6 py-2 pb-6 sm:px-10"
          style={{ scrollSnapType: "x proximity" }}
        >
          {LISTINGS.map((listing) => {
            const seeds = [listing.seed, `${listing.seed}-b`, `${listing.seed}-c`];
            return (
              <button
                key={listing.id}
                onClick={() => router.push(`/listings/${listing.id}`)}
                className="group flex-none basis-[300px] cursor-pointer text-left"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative h-[380px] w-full overflow-hidden bg-ink">
                  {seeds.map((seed, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={seed}
                      src={img(seed, 700, 900)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:[animation-play-state:running]"
                      style={{
                        opacity: i === 0 ? 1 : 0,
                        animation: "cardCycle 7.5s ease-in-out infinite",
                        animationDelay: `${-(i * 2.5)}s`,
                        animationPlayState: "paused",
                      }}
                    />
                  ))}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0)_45%,rgba(11,11,12,0.92)_100%)]" />
                  <span
                    className="absolute top-3.5 left-3.5 px-2.5 py-1.5 text-[10px] tracking-[0.1em] uppercase text-cream"
                    style={{ background: listing.negotiable ? "#B08D57" : "rgba(11,11,12,0.8)" }}
                  >
                    {listing.negotiable ? "Negotiable" : "Fixed Price"}
                  </span>
                  <div className="absolute right-[18px] bottom-4 left-[18px] text-cream">
                    <div className="mb-1 font-display text-xl font-semibold">{listing.title}</div>
                    <div className="mb-2.5 text-xs opacity-75">{listing.location}</div>
                    <div className="font-display text-[19px] text-gold">{priceLabel(listing)}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          aria-label="Scroll left"
          onClick={() => scrollBy(-324)}
          className="absolute top-1/2 left-2.5 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-ink/85 text-lg text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          ←
        </button>
        <button
          aria-label="Scroll right"
          onClick={() => scrollBy(324)}
          className="absolute top-1/2 right-2.5 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-ink/85 text-lg text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          →
        </button>
      </div>
    </section>
  );
}
