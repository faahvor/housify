"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  BadgeCheck,
  Heart,
  HeartOff,
  LifeBuoy,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  UserRoundSearch,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  getFavorites,
  getMyAgentRequests,
  getMyReports,
  getSentInquiries,
  sendAgentRequest,
  unsaveListing,
  type ReportStatus,
} from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ListingThumb } from "@/components/dashboards/listing-thumb";
import { INQUIRY_STATUS } from "@/components/dashboards/inquiries-inbox";
import { REQUEST_STATUS } from "@/components/dashboards/agent-requests";
import { REPORT_CATEGORY_LABEL, ReportForm, type ReportTargetOption } from "@/components/dashboards/report-form";
import { useMe } from "@/components/dashboards/account-status";
import {
  EmptyState,
  ErrorBanner,
  Metric,
  PageHeader,
  Panel,
  PrimaryLink,
  RowSkeleton,
  StatusPill,
  firstName,
  greeting,
} from "@/components/dashboards/ui";

/* ───────── Data hooks ───────── */

function useToken() {
  return useAppStore((s) => s.token);
}
export function useFavorites() {
  const token = useToken();
  return useQuery({ queryKey: ["favorites"], queryFn: () => getFavorites(token!), enabled: !!token });
}
export function useSentInquiries() {
  const token = useToken();
  return useQuery({ queryKey: ["inquiries", "sent"], queryFn: () => getSentInquiries(token!), enabled: !!token });
}
export function useMyRequests() {
  const token = useToken();
  return useQuery({ queryKey: ["agent-requests", "mine"], queryFn: () => getMyAgentRequests(token!), enabled: !!token });
}
export function useMyReports() {
  const token = useToken();
  return useQuery({ queryKey: ["reports", "mine"], queryFn: () => getMyReports(token!), enabled: !!token });
}

export const REPORT_STATUS: Record<ReportStatus, { label: string; pill: string }> = {
  open: { label: "Open", pill: "pending" },
  under_review: { label: "Under review", pill: "paused" },
  resolved: { label: "Resolved", pill: "active" },
  rejected: { label: "Closed", pill: "removed" },
};

/* ───────── Overview ───────── */

export function MemberOverview() {
  const { data: me } = useMe();
  const storeName = useAppStore((s) => s.user?.name);
  const favorites = useFavorites();
  const inquiries = useSentInquiries();
  const requests = useMyRequests();
  const reports = useMyReports();

  const openInquiries = (inquiries.data ?? []).filter((i) => i.status !== "closed" && i.status !== "declined");
  const activeRequests = (requests.data ?? []).filter((r) => r.status === "new" || r.status === "accepted");
  const openReports = (reports.data ?? []).filter((r) => r.status === "open" || r.status === "under_review");
  const name = firstName(me?.name ?? storeName);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow={today}
        title={name ? `${greeting()}, ${name}` : greeting()}
        description="Your saved homes, conversations with owners and requests — all in one place."
        actions={
          <PrimaryLink href="/browse" icon={Search}>
            Browse homes
          </PrimaryLink>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#4338ca] to-[#312e81] p-6 text-white shadow-glow duration-500 md:col-span-2">
          <div className="bg-grid absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/75">Saved homes</span>
              <Heart className="size-5 text-white/60" />
            </div>
            <div className="mt-4 font-display text-[52px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
              {favorites.isLoading ? "–" : (favorites.data ?? []).length}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/dashboard/saved" className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-sm font-semibold text-[#312e81] transition-transform hover:-translate-y-px">
                View saved
              </Link>
              <Link href="/dashboard/requests" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25">
                <UserRoundSearch className="size-4" /> Ask an agent to help
              </Link>
            </div>
          </div>
        </section>
        <Metric label="Open inquiries" value={openInquiries.length} icon={MessageSquare} hint={`${(inquiries.data ?? []).length} sent in total`} loading={inquiries.isLoading} delay={60} />
        <Metric label="Agent requests" value={activeRequests.length} icon={UserRoundSearch} hint={`${openReports.length} open support ${openReports.length === 1 ? "case" : "cases"}`} loading={requests.isLoading} delay={120} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel title="Your inquiries" description="Latest replies from owners" action={(inquiries.data ?? []).length ? { label: "View all", href: "/dashboard/inquiries" } : undefined} className="lg:col-span-3" delay={180}>
          {inquiries.isLoading ? (
            <RowSkeleton />
          ) : (inquiries.data ?? []).length === 0 ? (
            <EmptyState compact icon={MessageSquare} title="No inquiries yet" description="When you ask an owner about a property while signed in, you can follow it here." actionLabel="Find a home" actionHref="/browse" />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {inquiries.data!.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <ListingThumb src={i.listing?.photo} alt={i.listing?.title ?? "Listing"} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{i.listing?.title ?? "Deleted listing"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {i.owner?.name ?? "Owner"} · {formatDate(i.createdAt)}
                    </div>
                  </div>
                  <StatusPill status={INQUIRY_STATUS[i.status].pill} label={INQUIRY_STATUS[i.status].label} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recently saved" action={(favorites.data ?? []).length ? { label: "View all", href: "/dashboard/saved" } : undefined} className="lg:col-span-2" delay={240}>
          {favorites.isLoading ? (
            <RowSkeleton />
          ) : (favorites.data ?? []).length === 0 ? (
            <EmptyState compact icon={Heart} title="Nothing saved yet" description="Tap the heart on any listing to keep it here." />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {favorites.data!.slice(0, 4).map(({ listing, available }) => (
                <li key={listing.id} className="flex items-center gap-3 py-3">
                  <ListingThumb src={listing.photos[0]} alt={listing.title} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{listing.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{available ? formatListingPrice(listing) : "No longer available"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ───────── Saved ───────── */

export function SavedHomesPage() {
  const token = useToken();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useFavorites();
  const remove = useMutation({
    mutationFn: (id: string) => unsaveListing(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
  });
  const saved = data ?? [];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader eyebrow="Shortlist" title="Saved homes" description="Homes you've saved. We'll show you if one stops being available." />
      {isError && <ErrorBanner message="We couldn't load your saved homes." onRetry={() => refetch()} />}
      {isLoading ? (
        <Panel>
          <RowSkeleton rows={4} />
        </Panel>
      ) : saved.length === 0 ? (
        <Panel>
          <EmptyState icon={Heart} title="Nothing saved yet" description="Save homes while you browse to compare them here." actionLabel="Browse homes" actionHref="/browse" />
        </Panel>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map(({ listing, available, savedAt }, i) => (
            <li
              key={listing.id}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              className="animate-in fade-in slide-in-from-bottom-2 group overflow-hidden rounded-2xl border border-border bg-card shadow-soft duration-500"
            >
              <div className="relative">
                <ListingThumb src={listing.photos[0]} alt={listing.title} className={cn("aspect-[4/3] w-full rounded-none", !available && "grayscale")} />
                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {listing.type === "rent" ? "For rent" : "For sale"}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(listing.id)}
                  disabled={remove.isPending && remove.variables === listing.id}
                  aria-label={`Remove ${listing.title} from saved`}
                  className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-rose-500 shadow transition-transform hover:scale-110 disabled:opacity-50"
                >
                  {remove.isPending && remove.variables === listing.id ? <Loader2 className="size-4 animate-spin" /> : <HeartOff className="size-4" />}
                </button>
              </div>
              <div className="p-4">
                {!available && <div className="mb-2 inline-flex rounded-md bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">No longer available</div>}
                <div className="font-display text-lg font-semibold tabular-nums">{formatListingPrice(listing)}</div>
                <div className="mt-0.5 truncate text-sm font-medium">{listing.title}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {listing.location}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {listing.beds}</span>
                    <span className="flex items-center gap-1"><Bath className="size-3.5" /> {listing.baths}</span>
                    {listing.furnished && <span>Furnished</span>}
                  </span>
                  <span>Saved {formatDate(savedAt)}</span>
                </div>
                {listing.owner && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    Listed by {listing.owner.name}
                    {listing.owner.verified && <BadgeCheck className="size-3.5 text-primary" />}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────── Inquiries I've sent ───────── */

export function SentInquiriesPage() {
  const { data, isLoading, isError, refetch } = useSentInquiries();
  const items = data ?? [];
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader eyebrow="Conversations" title="Your inquiries" description="Every question and viewing request you've sent, and where it stands." />
      {isError && <ErrorBanner message="We couldn't load your inquiries." onRetry={() => refetch()} />}
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No inquiries yet" description="Ask about a property while signed in and you can track the owner's response here." actionLabel="Browse homes" actionHref="/browse" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
                <ListingThumb src={i.listing?.photo} alt={i.listing?.title ?? "Listing"} className="size-14" />
                <div className="min-w-[200px] flex-1">
                  <div className="truncate font-semibold">{i.listing?.title ?? "Deleted listing"}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    {i.owner ? (
                      <>
                        {i.owner.name}
                        {i.owner.verified && <BadgeCheck className="size-3.5 text-primary" />}
                        <span className="capitalize">· {i.owner.role}</span>
                      </>
                    ) : (
                      "Owner"
                    )}
                  </div>
                  {i.message && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">“{i.message}”</p>}
                </div>
                <div className="text-right">
                  <StatusPill status={INQUIRY_STATUS[i.status].pill} label={INQUIRY_STATUS[i.status].label} />
                  <div className="mt-1.5 text-[11px] text-muted-foreground">Sent {formatDate(i.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ───────── Agent requests ───────── */

const input =
  "h-11 w-full rounded-xl border border-border bg-secondary/50 px-3.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background";

function RequestAgentForm({ onDone }: { onDone: () => void }) {
  const token = useToken();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [area, setArea] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [budget, setBudget] = useState("");
  const [contact, setContact] = useState(me?.phone || me?.email || "");

  const send = useMutation({
    mutationFn: () => sendAgentRequest({ name: me?.name ?? "", contact, area, lookingFor, budget }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-requests", "mine"] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">Area</span>
        <input className={input} value={area} onChange={(e) => setArea(e.target.value)} required placeholder="e.g. Lekki" maxLength={120} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">Budget (optional)</span>
        <input className={input} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. ₦4M / year" maxLength={60} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[13px] font-medium">What are you looking for?</span>
        <textarea className={cn(input, "h-auto min-h-[100px] py-3")} value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} maxLength={1000} placeholder="Bedrooms, move-in date, must-haves…" />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[13px] font-medium">How should the agent reach you?</span>
        <input className={input} value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={120} placeholder="Phone or email" />
        <span className="mt-1.5 block text-xs text-muted-foreground">Only shared with the agent who accepts your request.</span>
      </label>
      {send.isError && <div role="alert" className="text-sm text-destructive sm:col-span-2">{send.error.message}</div>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="h-10 cursor-pointer rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button type="submit" disabled={send.isPending} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
          {send.isPending && <Loader2 className="size-4 animate-spin" />}
          Send request
        </button>
      </div>
    </form>
  );
}

export function MyAgentRequestsPage() {
  const { data, isLoading, isError, refetch } = useMyRequests();
  const [open, setOpen] = useState(false);
  const items = data ?? [];
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Get help"
        title="Agent requests"
        description="Tell us what you need and agents who cover that area can take it on."
        actions={
          !open && (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow">
              <Plus className="size-4" /> New request
            </button>
          )
        }
      />
      {isError && <ErrorBanner message="We couldn't load your requests." onRetry={() => refetch()} />}
      {open && (
        <Panel title="Request an agent" className="mb-4">
          <RequestAgentForm onDone={() => setOpen(false)} />
        </Panel>
      )}
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={UserRoundSearch} title="No requests yet" description="Ask for an agent and you'll see who takes it on here." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <MapPin className="size-4 text-muted-foreground" /> {r.area}
                  </div>
                  {r.lookingFor && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.lookingFor}</p>}
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {r.agent ? (
                      <span className="inline-flex items-center gap-1">
                        Agent: {r.agent.name}
                        {r.agent.verified && <BadgeCheck className="size-3.5 text-primary" />}
                      </span>
                    ) : (
                      "Waiting for an agent in this area"
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StatusPill status={REQUEST_STATUS[r.status].pill} label={REQUEST_STATUS[r.status].label} />
                  <div className="mt-1.5 text-[11px] text-muted-foreground">{formatDate(r.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ───────── Support & reports ───────── */

export function SupportPage() {
  const { data, isLoading, isError, refetch } = useMyReports();
  const favorites = useFavorites();
  const inquiries = useSentInquiries();
  const requests = useMyRequests();
  const [open, setOpen] = useState(false);

  // Things this person has actually interacted with, as report targets.
  const targets = new Map<string, ReportTargetOption>();
  for (const f of favorites.data ?? []) {
    targets.set(`l${f.listing.id}`, { id: f.listing.id, label: f.listing.title, kind: "listing" });
    if (f.listing.owner) targets.set(`u${f.listing.owner.id}`, { id: f.listing.owner.id, label: f.listing.owner.name, kind: f.listing.owner.role as ReportTargetOption["kind"] });
  }
  for (const i of inquiries.data ?? []) {
    if (i.listing) targets.set(`l${i.listing.id}`, { id: i.listing.id, label: i.listing.title, kind: "listing" });
    if (i.owner) targets.set(`u${i.owner.id}`, { id: i.owner.id, label: i.owner.name, kind: i.owner.role as ReportTargetOption["kind"] });
  }
  for (const r of requests.data ?? []) {
    if (r.agent) targets.set(`u${r.agent.id}`, { id: r.agent.id, label: r.agent.name, kind: "agent" });
  }

  const items = data ?? [];
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Help"
        title="Support & reports"
        description="Report a listing or person, raise a complaint, or ask us anything. Every case gets a status you can follow."
        actions={
          !open && (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow">
              <Plus className="size-4" /> New case
            </button>
          )
        }
      />
      {isError && <ErrorBanner message="We couldn't load your cases." onRetry={() => refetch()} />}
      {open && (
        <Panel title="Contact the Housify team" className="mb-4">
          <ReportForm targets={[...targets.values()]} onDone={() => setOpen(false)} />
        </Panel>
      )}
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No cases" description="If something doesn't feel right, tell us — we review every report." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li key={r.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-[200px] flex-1">
                    <div className="text-xs font-medium text-muted-foreground">{REPORT_CATEGORY_LABEL[r.category]}</div>
                    <div className="mt-0.5 font-semibold">{r.subject}</div>
                    {(r.targetListing?.title || r.targetUser?.name) && (
                      <div className="mt-0.5 text-xs text-muted-foreground">About: {r.targetListing?.title ?? r.targetUser?.name}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <StatusPill status={REPORT_STATUS[r.status].pill} label={REPORT_STATUS[r.status].label} />
                    <div className="mt-1.5 text-[11px] text-muted-foreground">Opened {formatDate(r.createdAt)}</div>
                  </div>
                </div>
                {r.resolution && (
                  <div className="mt-3 rounded-xl bg-secondary px-3.5 py-2.5 text-sm">
                    <span className="font-semibold">Housify: </span>
                    {r.resolution}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
