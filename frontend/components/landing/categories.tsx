import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHOTOS, type BrandPhoto } from "@/components/landing/images";
import { Reveal } from "@/components/landing/reveal";

const MARQUEE_AREAS = [
  "Lekki Phase 1",
  "Banana Island",
  "Ikoyi",
  "Victoria Island",
  "Oniru",
  "Ikeja GRA",
  "Ajah",
  "Sangotedo",
  "Yaba",
  "Magodo",
  "Maitama",
  "Asokoro",
  "Wuse 2",
  "Gwarinpa",
  "Old GRA, Port Harcourt",
];

export function AreaMarquee() {
  const items = [...MARQUEE_AREAS, ...MARQUEE_AREAS];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#07080c] py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#07080c] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#07080c] to-transparent" />
      <ul className="animate-marquee flex w-max items-center gap-10 hover:[animation-play-state:paused]" aria-label="Popular areas">
        {items.map((area, i) => (
          <li key={`${area}-${i}`} aria-hidden={i >= MARQUEE_AREAS.length} className="flex items-center gap-10">
            <Link
              href={`/browse?location=${encodeURIComponent(area)}`}
              tabIndex={i >= MARQUEE_AREAS.length ? -1 : undefined}
              className="font-display text-lg font-medium whitespace-nowrap text-white/55 transition-colors hover:text-white"
            >
              {area}
            </Link>
            <span className="size-1.5 rounded-full bg-indigo-400/60" />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Category {
  title: string;
  blurb: string;
  href: string;
  photo: BrandPhoto;
  className: string;
}

const CATEGORIES: Category[] = [
  {
    title: "Luxury homes",
    blurb: "Mansions and detached homes in the city's most sought-after streets.",
    href: "/browse?type=sale&propertyType=house",
    photo: PHOTOS.poolVilla,
    className: "md:col-span-2 md:row-span-2 min-h-[420px]",
  },
  {
    title: "Apartments",
    blurb: "Serviced flats and high-rise living.",
    href: "/browse?propertyType=apartment",
    photo: PHOTOS.tower,
    className: "min-h-[260px]",
  },
  {
    title: "Duplexes",
    blurb: "Space for the whole family.",
    href: "/browse?propertyType=duplex",
    photo: PHOTOS.duplex,
    className: "min-h-[260px]",
  },
  {
    title: "Furnished & shortlets",
    blurb: "Move in with just a suitcase.",
    href: "/browse?furnished=true",
    photo: PHOTOS.kitchen,
    className: "min-h-[260px]",
  },
  {
    title: "Land & plots",
    blurb: "Build exactly what you want.",
    href: "/browse?propertyType=land",
    photo: PHOTOS.land,
    className: "min-h-[260px]",
  },
];

export function Categories() {
  return (
    <section id="explore" className="scroll-mt-20 bg-background px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 text-sm font-semibold text-primary">Explore Housify</div>
            <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">What are you looking for?</h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            From a serviced studio in Yaba to a family home in Ikoyi, start with the kind of place you want.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.title} delay={i * 80} className={cn("group relative overflow-hidden rounded-3xl", c.className)}>
              <Link href={c.href} className="absolute inset-0 z-10" aria-label={`Browse ${c.title.toLowerCase()}`} />
              <Image
                src={c.photo.src}
                alt={c.photo.alt}
                fill
                sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                style={{ objectPosition: c.photo.focus }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-500 group-hover:from-black/85" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white">
                <div>
                  <h3 className={cn("font-semibold", i === 0 ? "text-3xl" : "text-xl")}>{c.title}</h3>
                  <p className="mt-1 max-w-xs text-sm text-white/75">{c.blurb}</p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-white group-hover:text-[#0b0d12]">
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
              <span className="absolute top-4 left-4 rounded-full bg-black/35 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
                {c.photo.place}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
