"use client";

import { useRouter } from "next/navigation";
import { img } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

const RENT_IMG = img("prestige-rent-panel", 1200, 1400);
const BUY_IMG = img("prestige-buy-panel", 1200, 1400);

export function PathSelector() {
  const router = useRouter();
  const setPath = useAppStore((s) => s.setPath);

  function choose(path: "rent" | "buy") {
    setPath(path);
    router.push("/search");
  }

  return (
    <section className="bg-grid-ink relative px-0 py-[100px] text-center sm:py-[120px]">
      <div className="mb-3.5 font-display text-[15px] italic text-gold">The first decision</div>
      <div className="mb-14 px-6 font-display text-[34px] font-semibold text-cream sm:text-[46px] lg:text-[58px]">
        What brings you here today?
      </div>

      <div className="relative mx-auto flex max-w-[1400px] flex-wrap justify-center gap-0.5 px-6">
        <button
          onClick={() => choose("rent")}
          className="group relative h-[420px] min-w-[320px] flex-1 basis-[480px] cursor-pointer overflow-hidden sm:h-[560px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={RENT_IMG}
            alt=""
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.13]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0.15),rgba(11,11,12,0.9))]" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-cream">
            <div className="mb-3.5 text-xs tracking-[0.3em] uppercase text-gold">01</div>
            <div className="px-4 text-center font-display text-[30px] font-semibold sm:text-[40px] lg:text-[48px]">
              Find an Apartment
              <br />
              to Rent
            </div>
            <div className="mt-5 border border-gold px-8 py-3.5 text-xs tracking-[0.2em] uppercase text-cream">
              Begin Renting →
            </div>
          </div>
        </button>

        <div className="hidden min-h-[420px] w-0.5 flex-none bg-gold sm:block sm:min-h-[560px]" />

        <button
          onClick={() => choose("buy")}
          className="group relative h-[420px] min-w-[320px] flex-1 basis-[480px] cursor-pointer overflow-hidden sm:h-[560px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BUY_IMG}
            alt=""
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.13]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(91,26,26,0.1),rgba(11,11,12,0.9))]" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-cream">
            <div className="mb-3.5 text-xs tracking-[0.3em] uppercase text-gold">02</div>
            <div className="px-4 text-center font-display text-[30px] font-semibold sm:text-[40px] lg:text-[48px]">
              Buy a House
            </div>
            <div className="mt-5 border border-gold px-8 py-3.5 text-xs tracking-[0.2em] uppercase text-cream">
              Begin Buying →
            </div>
          </div>
        </button>

        <div className="absolute top-1/2 left-1/2 z-10 flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gold bg-burgundy font-display text-xl italic text-cream shadow-[0_0_0_10px_#0B0B0C]">
          or
        </div>
      </div>
    </section>
  );
}
