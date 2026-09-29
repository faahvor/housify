"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { getPublicStats } from "@/lib/api";
import { HeroSearch } from "@/components/landing/hero-search";
import { PHOTOS } from "@/components/landing/images";

const POPULAR = ["Lekki", "Ikoyi", "Victoria Island", "Banana Island", "Ikeja GRA", "Maitama, Abuja"];

export function Hero() {
  const { data: stats } = useQuery({ queryKey: ["public-stats"], queryFn: getPublicStats, staleTime: 5 * 60_000 });
  // Only show numbers that are real and worth showing.
  const figures = stats
    ? [
        { value: stats.liveListings, label: stats.liveListings === 1 ? "home listed" : "homes listed" },
        { value: stats.verifiedProfessionals, label: "verified professionals" },
        { value: stats.areas, label: stats.areas === 1 ? "area covered" : "areas covered" },
      ].filter((f) => f.value > 0)
    : [];

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[#07080c] text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src={PHOTOS.hero.src}
          alt={PHOTOS.hero.alt}
          fill
          priority
          sizes="100vw"
          className="animate-kenburns object-cover"
          style={{ objectPosition: PHOTOS.hero.focus }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,8,12,0.92)_0%,rgba(7,8,12,0.7)_38%,rgba(30,27,75,0.35)_70%,rgba(7,8,12,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#07080c] to-transparent" />
        <div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-indigo-600/30 blur-[140px]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] items-center gap-14 px-5 pt-32 pb-24 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-28">
        <div>
          <div className="animate-in fade-in slide-in-from-bottom-3 mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md duration-700">
            <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
            Lagos · Abuja · Port Harcourt
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-4 max-w-[760px] text-[44px] leading-[1.02] font-semibold tracking-[-0.045em] duration-700 sm:text-6xl lg:text-[76px]">
            Find a home you love,{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">without the middlemen.</span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-4 mt-6 max-w-[560px] text-lg leading-relaxed text-white/75 delay-100 duration-700">
            Rent or buy directly from landlords, and work with verified agents and realtors when you want a hand. One place, no
            runaround.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-4 mt-10 delay-200 duration-700 [animation-fill-mode:backwards]">
            <HeroSearch />
          </div>

          <div className="animate-in fade-in mt-6 flex flex-wrap items-center gap-2 text-sm delay-300 duration-700 [animation-fill-mode:backwards]">
            <span className="mr-1 text-white/55">Popular:</span>
            {POPULAR.map((area) => (
              <Link
                key={area}
                href={`/browse?location=${encodeURIComponent(area)}`}
                className="rounded-full border border-white/15 px-3 py-1 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                {area}
              </Link>
            ))}
          </div>

          {figures.length > 0 && (
            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
              {figures.map((f) => (
                <div key={f.label}>
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="font-display text-3xl font-semibold tabular-nums">{f.value.toLocaleString()}</dd>
                  <dd className="text-sm text-white/60">{f.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Visual stack — brand photography, not listings */}
        <div className="relative hidden h-[560px] lg:block" aria-hidden>
          <div className="animate-in fade-in zoom-in-95 absolute top-0 right-0 h-[440px] w-[330px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/15 duration-1000">
            <Image src={PHOTOS.poolVilla.src} alt="" fill sizes="330px" className="object-cover" style={{ objectPosition: PHOTOS.poolVilla.focus }} />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-6 absolute bottom-0 left-4 h-[230px] w-[300px] overflow-hidden rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] ring-4 ring-[#07080c] delay-300 duration-1000 [animation-fill-mode:backwards]">
            <Image src={PHOTOS.mansion.src} alt="" fill sizes="300px" className="object-cover" style={{ objectPosition: PHOTOS.mansion.focus }} />
          </div>

          <div className="animate-float absolute top-16 left-0 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
              <BadgeCheck className="size-5" />
            </span>
            <span className="text-sm">
              <span className="block font-semibold">Verified professionals</span>
              <span className="text-white/60">Badges you can trust</span>
            </span>
          </div>
          <div className="animate-float absolute right-8 bottom-28 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl [animation-delay:-3s]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-400/25 text-indigo-200">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-sm">
              <span className="block font-semibold">Talk to the owner</span>
              <span className="text-white/60">Call or WhatsApp directly</span>
            </span>
          </div>
          <div className="animate-float absolute top-[46%] -left-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm backdrop-blur-xl [animation-delay:-5s]">
            <ShieldCheck className="size-4 text-cyan-300" />
            Report anything, we act
          </div>
        </div>
      </div>

      <a
        href="#explore"
        aria-label="Scroll to explore"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-white/55 transition-colors hover:text-white sm:flex"
      >
        Explore
        <ArrowDown className="size-4 animate-bounce" />
      </a>
    </section>
  );
}
