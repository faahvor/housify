"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHOTOS } from "@/components/landing/images";
import { Reveal } from "@/components/landing/reveal";

// Every answer here must describe how Housify actually works today.
const FAQS = [
  {
    q: "Does it cost anything to use Housify?",
    a: "No. Searching, saving homes, contacting owners and requesting an agent are free, and so is listing a property. Any fees for a rental or sale are agreed directly between you and the landlord, agent or realtor — Housify doesn't add any.",
  },
  {
    q: "What does the “Verified” badge mean?",
    a: "It means our team has reviewed that landlord, agent or realtor's account and approved it. New professional accounts start unverified, and we can remove a badge if something changes.",
  },
  {
    q: "How do I contact a landlord?",
    a: "Open the listing and send an inquiry or request a viewing. The owner is notified straight away, and if you're signed in you can follow their reply from your dashboard.",
  },
  {
    q: "I don't have time to search. Can someone help?",
    a: "Yes. Create a free account and send an agent request with the area, budget and what you need. Agents who cover that area can accept it — your contact details are only shared with the agent who takes it on.",
  },
  {
    q: "What happens if I report a listing or a person?",
    a: "Our team reviews every report and you'll get a notification as its status changes. Listings that break the rules are removed, and accounts can be suspended.",
  },
  {
    q: "How do I list my property?",
    a: "Join as a landlord, agent or realtor, then publish your listing from your dashboard with photos, price, amenities and the dates you're available for viewings. It goes live as soon as you publish.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-secondary/50 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="mb-3 text-sm font-semibold text-primary">Questions, answered</div>
          <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Before you begin.</h2>
          <p className="mt-4 max-w-sm text-muted-foreground">Still unsure about something? Create an account and send us a question from your dashboard.</p>
        </Reveal>

        <Reveal delay={100} className="divide-y divide-border rounded-[28px] border border-border bg-card px-6 shadow-soft sm:px-8">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left font-sans text-[17px] font-semibold tracking-normal"
                  >
                    {faq.q}
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-all duration-300", isOpen && "rotate-45 border-primary bg-primary text-primary-foreground")}>
                      <Plus className="size-4" />
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} className={cn("grid transition-all duration-500 ease-out", isOpen ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <p className="overflow-hidden leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="bg-background px-5 py-24 sm:px-8">
      <Reveal className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[36px] bg-[#0b0d12] px-8 py-16 text-white sm:px-16 sm:py-24">
        <Image src={PHOTOS.poolside.src} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,#1e1b4b_0%,rgba(49,46,129,0.85)_45%,rgba(11,13,18,0.35)_100%)]" />
        <div className="absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-cyan-400/25 blur-[120px]" />
        <div className="max-w-2xl">
          <h2 className="text-4xl leading-[1.05] font-semibold sm:text-6xl">Your next home is one search away.</h2>
          <p className="mt-5 text-lg text-white/75">Join Housify free — save homes, talk to owners and track everything in one place.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/browse" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0b0d12] transition-transform hover:-translate-y-px">
              Start searching
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/join" className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 text-sm font-semibold transition-colors hover:bg-white/10">
              Create a free account
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
