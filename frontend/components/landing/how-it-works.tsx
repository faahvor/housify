"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, Heart, KeyRound, LayoutDashboard, MessageCircle, Search, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHOTOS, type BrandPhoto } from "@/components/landing/images";
import { Reveal } from "@/components/landing/reveal";

const FLOWS = {
  seeker: {
    label: "I'm looking for a home",
    photo: PHOTOS.lifestyle as BrandPhoto,
    cta: { label: "Start searching", href: "/browse" },
    steps: [
      { icon: Search, title: "Search with real filters", body: "Area, budget, bedrooms, furnished or not — see homes that actually match." },
      { icon: Heart, title: "Save your shortlist", body: "Keep the ones you like in one place. We'll tell you if one stops being available." },
      { icon: MessageCircle, title: "Talk to the owner", body: "Ask questions or request a viewing directly. Track every reply from your dashboard." },
      { icon: KeyRound, title: "Move in", body: "Agree terms with the person who holds the keys — or bring in a verified agent to help." },
    ],
  },
  lister: {
    label: "I'm listing a property",
    photo: PHOTOS.livingRoom as BrandPhoto,
    cta: { label: "List your property", href: "/join" },
    steps: [
      { icon: ShieldCheck, title: "Create your account", body: "Join as a landlord, agent or realtor. We review professionals and add a verified badge." },
      { icon: Upload, title: "Publish your listing", body: "Photos, price, amenities and viewing dates — live as soon as you publish." },
      { icon: BellRing, title: "Get real inquiries", body: "Serious renters and buyers reach you directly, and you're notified instantly." },
      { icon: LayoutDashboard, title: "Manage everything", body: "Update statuses, pause listings and keep private notes from one dashboard." },
    ],
  },
} as const;

type FlowKey = keyof typeof FLOWS;
const STEP_MS = 4500;

export function HowItWorks() {
  const [flow, setFlow] = useState<FlowKey>("seeker");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = FLOWS[flow];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % current.steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, paused, current.steps.length]);

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-secondary/50 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-3 text-sm font-semibold text-primary">How Housify works</div>
          <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Simple for everyone, on both sides.</h2>
        </Reveal>

        <Reveal className="mb-12 flex justify-center">
          <div role="tablist" aria-label="Choose your journey" className="inline-flex rounded-full border border-border bg-card p-1.5 shadow-soft">
            {(Object.keys(FLOWS) as FlowKey[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={flow === key}
                onClick={() => {
                  setFlow(key);
                  setActive(0);
                }}
                className={cn(
                  "cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                  flow === key ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {FLOWS[key].label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid items-center gap-12 lg:grid-cols-2" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <ol className="flex flex-col gap-3">
            {current.steps.map((step, i) => {
              const on = i === active;
              const Icon = step.icon;
              return (
                <li key={`${flow}-${step.title}`}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={on ? "step" : undefined}
                    className={cn(
                      "relative flex w-full cursor-pointer items-start gap-5 overflow-hidden rounded-3xl border p-6 text-left transition-all duration-500",
                      on ? "border-primary/25 bg-card shadow-[0_20px_50px_-20px_rgba(79,70,229,0.35)]" : "border-transparent hover:bg-card/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-500",
                        on ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border"
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
                      <span className="mt-0.5 block text-lg font-semibold">{step.title}</span>
                      <span className={cn("grid transition-all duration-500", on ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                        <span className="overflow-hidden text-muted-foreground">{step.body}</span>
                      </span>
                    </span>
                    {on && (
                      <span
                        key={`${flow}-${active}-${paused}`}
                        className="absolute bottom-0 left-0 h-0.5 bg-primary"
                        style={{ animation: paused ? "none" : `progress-fill ${STEP_MS}ms linear forwards`, width: paused ? "100%" : undefined }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
            <li className="mt-4 pl-6">
              <Link href={current.cta.href} className="group inline-flex items-center gap-2 font-semibold text-primary">
                {current.cta.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          </ol>

          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-30px_rgba(11,13,18,0.45)] sm:aspect-[5/5] lg:aspect-[4/5]">
            {(Object.keys(FLOWS) as FlowKey[]).map((key) => (
              <Image
                key={key}
                src={FLOWS[key].photo.src}
                alt={FLOWS[key].photo.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={cn("object-cover transition-all duration-700", flow === key ? "scale-100 opacity-100" : "scale-105 opacity-0")}
                style={{ objectPosition: FLOWS[key].photo.focus }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute right-6 bottom-6 left-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-xl">
              <div className="text-xs text-white/70">Step {active + 1} of {current.steps.length}</div>
              <div className="mt-0.5 font-semibold">{current.steps[active].title}</div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
