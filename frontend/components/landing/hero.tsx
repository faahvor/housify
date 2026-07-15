import { img } from "@/lib/mock-data";

const HERO_IMAGES = [1, 2, 3, 4, 5].map((n, i) => ({
  url: img(`prestige-hero-${n}`, 1600, 1000),
  delay: `0s, -${i * 6}s`,
}));

export function Hero() {
  return (
    <section className="bg-grid-ink relative h-screen w-full overflow-hidden">
      {HERO_IMAGES.map((image) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image.url}
          src={image.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            animation: "heroZoom 42s ease-in-out infinite alternate, heroFade 30s ease-in-out infinite",
            animationDelay: image.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0.55)_0%,rgba(11,11,12,0.25)_40%,rgba(11,11,12,0.85)_100%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-7 text-[13px] tracking-[0.35em] uppercase text-gold">
          Direct from Landlord to You
        </div>
        <h1 className="max-w-5xl font-display text-[56px] leading-[0.98] font-semibold text-cream sm:text-[80px] md:text-[110px] lg:text-[148px]">
          A home worth <span className="italic text-gold">theatre.</span>
        </h1>
        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-offwhite/80">
          No agencies. No middlemen. Every listing on Prestige Homes comes straight from the landlord who
          owns it.
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2.5 text-offwhite/75">
        <div className="text-[11px] tracking-[0.25em] uppercase">Scroll to begin</div>
        <div
          className="h-11 w-px bg-[linear-gradient(180deg,#B08D57,transparent)]"
          style={{ animation: "shimmerGold 2.4s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}
