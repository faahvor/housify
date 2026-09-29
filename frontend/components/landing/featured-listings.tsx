"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, RotateCw, Sparkles } from "lucide-react";
import { searchListings } from "@/lib/api";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import { PHOTOS } from "@/components/landing/images";
import { Reveal } from "@/components/landing/reveal";

export function FeaturedListings() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: () => searchListings({ limit: 6, sort: "newest" }),
    staleTime: 60_000,
  });
  const listings = data?.items ?? [];

  return (
    <section className="bg-background px-5 pb-24 sm:px-8 lg:pb-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 text-sm font-semibold text-primary">Fresh on Housify</div>
            <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Newly listed homes</h2>
          </div>
          {listings.length > 0 && (
            <Link href="/browse" className="group inline-flex items-center gap-2 font-semibold text-primary">
              Browse all {data!.total > listings.length ? data!.total.toLocaleString() : ""} homes
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
            <p className="text-muted-foreground">We couldn&apos;t load listings right now.</p>
            <button onClick={() => refetch()} className="mt-4 inline-flex cursor-pointer items-center gap-2 font-semibold text-primary">
              <RotateCw className="size-4" /> Try again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <Reveal className="relative overflow-hidden rounded-[32px] bg-[#0b0d12] text-white">
            <Image src={PHOTOS.estate.src} alt={PHOTOS.estate.alt} fill sizes="100vw" className="object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d12] via-[#0b0d12]/80 to-transparent" />
            <div className="relative max-w-xl px-8 py-16 sm:px-14 sm:py-20">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="size-3.5 text-cyan-300" /> Just getting started
              </span>
              <h3 className="mt-5 text-3xl leading-tight font-semibold sm:text-4xl">The first homes are on their way.</h3>
              <p className="mt-4 text-white/70">
                Every listing on Housify comes straight from a landlord, agent or realtor. Own a property or represent one? Be among
                the first people renters and buyers see.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/list-property" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0b0d12] transition-transform hover:-translate-y-px">
                  <Plus className="size-4" /> List your property
                </Link>
                <Link href="/join" className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-sm font-semibold transition-colors hover:bg-white/10">
                  Create a free account
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l, i) => (
              <Reveal key={l.id} delay={(i % 3) * 90}>
                <ListingCard listing={l} className="h-full" />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
