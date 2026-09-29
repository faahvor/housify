"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Briefcase, Building2, Check, Clock, Loader2, MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getProfessional, sendAgentRequest, type Professional } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { useMe } from "@/components/dashboards/account-status";
import { ListingCard } from "@/components/listings/listing-card";
import { ReportButton, ShareButton } from "@/components/listings/actions";

const field =
  "h-11 w-full rounded-xl border border-border bg-secondary/50 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background";

function RequestAgentForm({ agent }: { agent: Professional }) {
  const token = useAppStore((s) => s.token);
  const role = useAppStore((s) => s.role);
  const { data: me } = useMe();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [area, setArea] = useState(agent.areasCovered[0] ?? "");
  const [lookingFor, setLookingFor] = useState("");
  const [budget, setBudget] = useState("");

  const send = useMutation({
    mutationFn: () => sendAgentRequest({ name: name || me?.name || "", contact: contact || me?.phone || me?.email || "", area, lookingFor, budget, agentId: agent.id }, token),
  });

  if (send.isSuccess) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <div className="font-semibold">Request sent to {agent.name}</div>
        <p className="mt-1 text-sm text-muted-foreground">They&apos;ve been notified and will contact you.</p>
        {token && role === "user" && (
          <Link href="/dashboard/requests" className="mt-4 text-sm font-semibold text-primary hover:underline">
            Track it in your dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
      className="flex flex-col gap-3"
    >
      {!me && (
        <>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" required maxLength={100} />
          <input className={field} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or email" aria-label="Phone or email" required maxLength={120} />
        </>
      )}
      <input className={field} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area, e.g. Lekki" aria-label="Area" required maxLength={120} />
      <input className={field} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (optional), e.g. ₦5M/yr" aria-label="Budget" maxLength={60} />
      <textarea className={cn(field, "h-auto min-h-[90px] py-3")} value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="What are you looking for?" aria-label="What you're looking for" maxLength={1000} />
      {send.isError && (
        <div role="alert" className="text-sm text-destructive">
          {send.error.message}
        </div>
      )}
      <button type="submit" disabled={send.isPending} className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
        {send.isPending && <Loader2 className="size-4 animate-spin" />}
        Request {agent.name.split(" ")[0]}
      </button>
    </form>
  );
}

function waLink(number: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "").replace(/^0/, "234")}?text=${encodeURIComponent("Hi, I found you on Housify.")}`;
}

export function ProfessionalView({ id }: { id: string }) {
  const { data: me } = useMe();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["professional", id],
    queryFn: () => getProfessional(id),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 rounded-[28px] bg-secondary" />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRound className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold">Profile not available</h1>
        <p className="mt-2 max-w-md text-muted-foreground">{error?.message ?? "This profile may have been removed."}</p>
        <Link href="/browse?tab=people" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow">
          Find another professional
        </Link>
      </div>
    );
  }

  const { profile, listings } = data;
  const isSelf = me?.id === profile.id;
  const roleLabel = ROLE_LABEL[profile.role];

  return (
    <>
      <Link href="/browse?tab=people" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All professionals
      </Link>

      <section className="relative overflow-hidden rounded-[32px] bg-[#0b0d12] p-8 text-white sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#1e1b4b_0%,#312e81_45%,#0b0d12_100%)]" />
        <div className="bg-grid absolute inset-0 opacity-15 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Avatar name={profile.name} src={profile.avatarUrl} size={88} className="ring-4 ring-white/15" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold sm:text-4xl">{profile.name}</h1>
              {profile.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <BadgeCheck className="size-4" /> Verified {roleLabel.toLowerCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
                  <Clock className="size-3.5" /> Not yet verified
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
              <span>{roleLabel}</span>
              <span>On Housify since {new Date(profile.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
              <span>
                {profile.liveListings} live {profile.liveListings === 1 ? "listing" : "listings"}
              </span>
            </div>
          </div>
          {!isSelf && (profile.phone || profile.whatsapp) && (
            <div className="flex gap-2">
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#0b0d12]">
                  <Phone className="size-4" /> Call
                </a>
              )}
              <a href={waLink(profile.whatsapp || profile.phone!)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold hover:bg-white/10">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {(profile.bio || profile.experience) && (
            <section>
              <h2 className="text-xl font-semibold">About</h2>
              {profile.bio && <p className="mt-3 leading-relaxed whitespace-pre-line text-foreground/85">{profile.bio}</p>}
              {profile.experience && (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <Briefcase className="mt-0.5 size-4 shrink-0" /> {profile.experience}
                </p>
              )}
            </section>
          )}

          <section className={cn(profile.bio || profile.experience ? "mt-10" : "")}>
            <h2 className="text-xl font-semibold">Live listings</h2>
            {listings.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
                <Building2 className="mb-3 size-7 text-primary/70" />
                <p className="text-muted-foreground">{profile.name.split(" ")[0]} doesn&apos;t have any live listings right now.</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          {(profile.areasCovered.length > 0 || profile.states.length > 0) && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-sans text-base font-semibold tracking-normal">Areas covered</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile.areasCovered.length ? profile.areasCovered : profile.states).map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm">
                    <MapPin className="size-3.5 text-primary" /> {a.replace(", Nigeria", "")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.role === "agent" && !isSelf && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-sans text-base font-semibold tracking-normal">Work with {profile.name.split(" ")[0]}</h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">Tell them what you need. They&apos;ll be notified straight away.</p>
              <RequestAgentForm agent={profile} />
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <ShareButton />
            {!isSelf && <ReportButton category={profile.role} targetId={profile.id} targetLabel={profile.name} label={`Report this ${roleLabel.toLowerCase()}`} />}
          </div>
        </aside>
      </div>
    </>
  );
}
