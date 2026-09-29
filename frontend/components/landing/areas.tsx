import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PHOTOS, type BrandPhoto } from "@/components/landing/images";
import { Reveal } from "@/components/landing/reveal";

const AREAS: { name: string; tagline: string; query: string; photo: BrandPhoto }[] = [
  { name: "Lekki", tagline: "Estates, beach life & the Link Bridge", query: "Lekki", photo: PHOTOS.areaLekki },
  { name: "Victoria Island", tagline: "Waterfront living at the heart of business", query: "Victoria Island", photo: PHOTOS.areaVI },
  { name: "Ikoyi", tagline: "Leafy, quiet and prestigious", query: "Ikoyi", photo: PHOTOS.areaIkoyi },
  { name: "Ajah & Sangotedo", tagline: "New estates with room to grow", query: "Ajah", photo: PHOTOS.estate },
  { name: "Abuja", tagline: "Maitama, Asokoro, Wuse & beyond", query: "Abuja", photo: PHOTOS.areaAbuja },
  { name: "Port Harcourt", tagline: "GRA homes in the Garden City", query: "Port Harcourt", photo: PHOTOS.areaPH },
];

const GUTTER = "max(1.25rem, calc((100% - 1320px) / 2 + 2rem))";

export function Areas() {
  return (
    <section className="overflow-hidden bg-secondary/50 py-24 lg:py-32">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 text-sm font-semibold text-primary">Neighbourhoods</div>
            <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Where do you want to live?</h2>
          </div>
          <p className="max-w-sm text-muted-foreground">Start with the neighbourhood and we&apos;ll show you what&apos;s available there right now.</p>
        </Reveal>
      </div>

      <div
        className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
        // Line the first card up with the 1320px content column, then let the row bleed right.
        // Snap padding must match, or snapping scrolls the row back to the edge.
        style={{ paddingInline: GUTTER, scrollPaddingInline: GUTTER }}
      >
        {AREAS.map((area, i) => (
          <Reveal key={area.name} delay={i * 70} className="group relative aspect-[3/4] w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[28px] sm:w-[300px]">
            <Link href={`/browse?location=${encodeURIComponent(area.query)}`} className="absolute inset-0 z-10" aria-label={`Homes in ${area.name}`} />
            <Image
              src={area.photo.src}
              alt={area.photo.alt}
              fill
              sizes="340px"
              className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
              style={{ objectPosition: area.photo.focus }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-semibold">{area.name}</h3>
                <ArrowUpRight className="size-5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-sm text-white/70">{area.tagline}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
