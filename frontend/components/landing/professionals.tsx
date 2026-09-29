import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  Check,
  EyeOff,
  Flag,
  KeyRound,
  LayoutDashboard,
  Lock,
  PhoneCall,
  UserRoundSearch,
} from "lucide-react";
import { PHOTOS } from "@/components/landing/images";
import { Reveal } from "@/components/landing/reveal";

const PROS = [
  {
    icon: KeyRound,
    title: "Landlords",
    body: "Deal with the owner. No agency layers between you and the keys.",
    points: ["Direct calls & WhatsApp", "Viewing dates on every listing"],
    cta: { label: "Browse homes from owners", href: "/browse" },
  },
  {
    icon: UserRoundSearch,
    title: "Agents",
    body: "Busy? Tell us what you need and agents who cover that area can take it on.",
    points: ["Your contact stays private until one accepts", "Track progress from your dashboard"],
    cta: { label: "Request an agent", href: "/dashboard/requests" },
  },
  {
    icon: BriefcaseBusiness,
    title: "Realtors",
    body: "Licensed professionals representing properties for owners, for sale and to let.",
    points: ["Verified before they get a badge", "Report any concerns to us"],
    cta: { label: "See realtor listings", href: "/browse" },
  },
];

export function Professionals() {
  return (
    <section className="bg-background px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-3 text-sm font-semibold text-primary">The right person for the job</div>
          <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Go direct, or bring in a professional.</h2>
          <p className="mt-4 text-muted-foreground">Everyone on Housify has a real profile, so you know exactly who you&apos;re dealing with.</p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {PROS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal
                key={p.title}
                delay={i * 90}
                className="group relative flex flex-col overflow-hidden rounded-[28px] border border-border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_30px_60px_-25px_rgba(79,70,229,0.35)]"
              >
                <div className="absolute -top-20 -right-20 size-48 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-0" />
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-800 text-white shadow-glow">
                  <Icon className="size-6" />
                </span>
                <h3 className="relative mt-6 text-2xl font-semibold">{p.title}</h3>
                <p className="relative mt-2 text-muted-foreground">{p.body}</p>
                <ul className="relative mt-6 flex flex-col gap-2.5 text-sm">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={3} />
                      {pt}
                    </li>
                  ))}
                </ul>
                <Link href={p.cta.href} className="relative mt-auto inline-flex items-center gap-2 pt-8 font-semibold text-primary">
                  {p.cta.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  { icon: BadgeCheck, title: "Verified badges", body: "Landlords, agents and realtors are reviewed by our team before they're marked as verified." },
  { icon: PhoneCall, title: "Direct contact", body: "Reach the person who can actually answer — no call centres, no forms that disappear." },
  { icon: Flag, title: "Report anything", body: "Flag a listing or a person in two taps. Every report is reviewed and you're told the outcome." },
  { icon: Lock, title: "Accountability", body: "Accounts that break the rules are suspended and their listings come down, immediately." },
];

export function Trust() {
  return (
    <section className="relative isolate overflow-hidden bg-[#07080c] px-5 py-24 text-white sm:px-8 lg:py-36">
      <Image src={PHOTOS.bridgeNight.src} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07080c] via-[#07080c]/70 to-[#07080c]" />
      <div className="absolute top-1/3 left-1/2 -z-10 size-[600px] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[160px]" />

      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-3 text-sm font-semibold text-indigo-300">Trust & safety</div>
          <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Built so you can deal with confidence.</h2>
          <p className="mt-4 text-white/65">
            House hunting in Nigeria shouldn&apos;t mean paying for inspections that go nowhere. These are the rules everyone on
            Housify plays by.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Icon = t.icon;
            return (
              <Reveal key={t.title} delay={i * 90} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition-colors duration-500 hover:border-indigo-400/40 hover:bg-white/[0.07]">
                <Icon className="size-7 text-indigo-300" />
                <h3 className="mt-5 text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{t.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TOOLS = [
  { icon: LayoutDashboard, text: "A dashboard for listings, inquiries and clients" },
  { icon: BellRing, text: "Instant notifications when someone gets in touch" },
  { icon: EyeOff, text: "Pause a listing in one click when it's taken" },
  { icon: BadgeCheck, text: "A verified badge on your profile and listings" },
];

export function ForProfessionals() {
  return (
    <section className="bg-background px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-30px_rgba(11,13,18,0.5)]">
            <Image src={PHOTOS.villa.src} alt={PHOTOS.villa.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="animate-float absolute -right-4 -bottom-8 hidden w-[240px] overflow-hidden rounded-3xl shadow-[0_30px_60px_-20px_rgba(11,13,18,0.55)] ring-8 ring-background sm:block">
            <div className="relative aspect-[4/3]">
              <Image src={PHOTOS.kitchen.src} alt={PHOTOS.kitchen.alt} fill sizes="240px" className="object-cover" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mb-3 text-sm font-semibold text-primary">For landlords, agents & realtors</div>
          <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">Put your property in front of serious people.</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Housify is free to join. List in minutes, get inquiries from people who&apos;ve already seen the details, and manage it all
            from one place.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.text} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="pt-2 text-sm font-medium">{t.text}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/join?role=landlord" className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px hover:brightness-110">
              List your property
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/join?role=agent" className="inline-flex h-12 items-center rounded-full border border-border px-6 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
              Join as an agent or realtor
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
