"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bath, BedDouble, Building2, CirclePause, CirclePlay, ImageIcon, MapPin, MessageSquare, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { deleteListing, getMyListings, updateListingStatus, type Listing } from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
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
import { AccountStatusPanel, useMe } from "@/components/dashboards/account-status";
import { ListingThumb } from "@/components/dashboards/listing-thumb";
import { INQUIRY_STATUS, useReceivedInquiries } from "@/components/dashboards/inquiries-inbox";

export function useMyListings() {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: ["listings", "mine"],
    queryFn: () => getMyListings(token!),
    enabled: !!token,
  });
}

const STATUS_LABEL: Record<Listing["status"], string> = {
  active: "Live",
  paused: "Paused",
  pending: "In review",
  removed: "Removed",
};

/* ───────────── Overview (landlord + realtor) ───────────── */

interface PortfolioOverviewProps {
  basePath: string;
  audience: string;
  inquiriesCopy: string;
}

export function PortfolioOverview({ basePath, audience, inquiriesCopy }: PortfolioOverviewProps) {
  const { data: me } = useMe();
  const storeName = useAppStore((s) => s.user?.name);
  const { data, isLoading, isError, refetch } = useMyListings();
  const listings = data ?? [];
  const inquiries = useReceivedInquiries();
  const openInquiries = (inquiries.data ?? []).filter((i) => i.status !== "closed" && i.status !== "declined");

  const count = (status: Listing["status"]) => listings.filter((l) => l.status === status).length;
  const active = count("active");
  const paused = count("paused");
  const pending = count("pending");
  const forRent = listings.filter((l) => l.type === "rent").length;
  const forSale = listings.length - forRent;
  const name = firstName(me?.name ?? storeName);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow={today}
        title={name ? `${greeting()}, ${name}` : greeting()}
        description={`Here's how your properties are doing with ${audience}.`}
        actions={
          <PrimaryLink href={`${basePath}/listings/new`} icon={Plus}>
            New listing
          </PrimaryLink>
        }
      />

      {isError && <ErrorBanner message="We couldn't load your listings." onRetry={() => refetch()} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Feature cell */}
        <section className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#4338ca] to-[#312e81] p-6 text-white shadow-glow duration-500 md:col-span-2 xl:row-span-2">
          <div className="bg-grid absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/75">Your portfolio</span>
              <Building2 className="size-5 text-white/60" />
            </div>
            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-[56px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                {isLoading ? "–" : listings.length}
              </span>
              <span className="mb-1.5 text-sm text-white/70">{listings.length === 1 ? "property listed" : "properties listed"}</span>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-white/15">
                {listings.length > 0 &&
                  [
                    { v: active, c: "bg-white" },
                    { v: paused, c: "bg-white/45" },
                    { v: pending, c: "bg-cyan-300" },
                  ]
                    .filter((s) => s.v > 0)
                    .map((s, i) => <div key={i} className={cn("h-full rounded-full", s.c)} style={{ width: `${(s.v / listings.length) * 100}%` }} />)}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Live", value: active, dot: "bg-white" },
                  { label: "Paused", value: paused, dot: "bg-white/45" },
                  { label: "In review", value: pending, dot: "bg-cyan-300" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <span className={cn("size-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </div>
                    <div className="mt-1 font-display text-xl font-semibold tabular-nums">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Metric label="Open inquiries" value={openInquiries.length} icon={MessageSquare} hint={`${(inquiries.data ?? []).length} received in total`} loading={inquiries.isLoading} delay={60} />
        <Metric label="For rent" value={forRent} icon={Building2} hint={`${forSale} for sale`} loading={isLoading} delay={120} />
        <AccountStatusPanel profileHref={`${basePath}/profile`} className="md:col-span-2" delay={180} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title="Recent listings"
          description="Your newest properties"
          action={listings.length > 0 ? { label: "Manage all", href: `${basePath}/listings` } : undefined}
          className="lg:col-span-3"
          delay={240}
        >
          {isLoading ? (
            <RowSkeleton />
          ) : listings.length === 0 ? (
            <EmptyState
              compact
              icon={Building2}
              title="No listings yet"
              description={`List your first property to start reaching ${audience} directly.`}
              actionLabel="Create a listing"
              actionHref={`${basePath}/listings/new`}
            />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {listings.slice(0, 4).map((l) => (
                <li key={l.id} className="flex items-center gap-4 py-3">
                  <ListingThumb src={l.photos[0]} alt={l.title} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {l.location}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm font-semibold tabular-nums">{formatListingPrice(l)}</div>
                    <div className="text-[11px] text-muted-foreground">Listed {formatDate(l.createdAt)}</div>
                  </div>
                  <StatusPill status={l.status} label={STATUS_LABEL[l.status]} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Inquiries"
          description="Messages and viewing requests"
          action={(inquiries.data ?? []).length > 0 ? { label: "Open inbox", href: `${basePath}/inquiries` } : undefined}
          className="lg:col-span-2"
          delay={300}
        >
          {inquiries.isLoading ? (
            <RowSkeleton />
          ) : openInquiries.length === 0 ? (
            <EmptyState compact icon={MessageSquare} title="No open inquiries" description={inquiriesCopy} />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {openInquiries.slice(0, 4).map((i) => (
                <li key={i.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">{i.name}</span>
                    <StatusPill status={INQUIRY_STATUS[i.status].pill} label={INQUIRY_STATUS[i.status].label} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {i.listing?.title ?? "Deleted listing"} · {formatDate(i.createdAt)}
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

/* ───────────── Listings manager ───────────── */

type Filter = "all" | Listing["status"];

export function ListingsManager({ audience, basePath }: { audience: string; basePath: string }) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useMyListings();
  const [filter, setFilter] = useState<Filter>("all");
  const listings = data ?? [];

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) => updateListingStatus(token!, id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listings", "mine"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteListing(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listings", "mine"] }),
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Live" },
    { key: "paused", label: "Paused" },
    { key: "pending", label: "In review" },
    { key: "removed", label: "Removed" },
  ];
  const visible = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Portfolio"
        title="Listings"
        description={`Pause a listing to hide it from ${audience} without deleting it.`}
        actions={
          <PrimaryLink href={`${basePath}/listings/new`} icon={Plus}>
            New listing
          </PrimaryLink>
        }
      />

      {isError && <ErrorBanner message="We couldn't load your listings." onRetry={() => refetch()} />}
      {remove.isError && <ErrorBanner message={remove.error.message} />}
      {toggle.isError && <ErrorBanner message={toggle.error instanceof Error ? toggle.error.message : "Couldn't update that listing."} />}

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-soft scrollbar-none sm:inline-flex">
        {filters.map((f) => {
          const n = f.key === "all" ? listings.length : listings.filter((l) => l.status === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", filter === f.key ? "bg-white/20" : "bg-secondary")}>{n}</span>
            </button>
          );
        })}
      </div>

      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton rows={4} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={listings.length === 0 ? "No listings yet" : "Nothing here"}
            description={
              listings.length === 0
                ? `Add your first property to start reaching ${audience} directly.`
                : "No listings match this filter."
            }
            actionLabel={listings.length === 0 ? "Create a listing" : undefined}
            actionHref={listings.length === 0 ? `${basePath}/listings/new` : undefined}
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((l, i) => {
              const canToggle = l.status === "active" || l.status === "paused";
              const busy = toggle.isPending && toggle.variables?.id === l.id;
              return (
                <li
                  key={l.id}
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                  className="animate-in fade-in flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 duration-300 sm:px-6"
                >
                  <ListingThumb src={l.photos[0]} alt={l.title} className="size-16" />
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold">{l.title}</span>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {l.type === "rent" ? "Rent" : "Sale"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{l.address}</span>
                    </div>
                    {l.status === "removed" && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                        <ShieldAlert className="mt-px size-3.5 shrink-0" />
                        Removed by Housify{l.moderationNote ? `: ${l.moderationNote}` : "."}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {l.beds} bed</span>
                      <span className="flex items-center gap-1"><Bath className="size-3.5" /> {l.baths} bath</span>
                      {l.photos.length > 0 && <span className="flex items-center gap-1"><ImageIcon className="size-3.5" /> {l.photos.length} photos</span>}
                    </div>
                  </div>
                  <div className="w-[140px]">
                    <div className="text-sm font-semibold tabular-nums">{formatListingPrice(l)}</div>
                    <div className="text-[11px] text-muted-foreground">{l.negotiable ? "Negotiable" : "Fixed price"}</div>
                  </div>
                  <StatusPill status={l.status} label={STATUS_LABEL[l.status]} />
                  {canToggle && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggle.mutate({ id: l.id, status: l.status === "active" ? "paused" : "active" })}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-wait disabled:opacity-50"
                    >
                      {l.status === "active" ? <CirclePause className="size-3.5" /> : <CirclePlay className="size-3.5" />}
                      {l.status === "active" ? "Pause" : "Go live"}
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    {l.status !== "removed" && (
                      <Link
                        href={`${basePath}/listings/${l.id}`}
                        aria-label={`Edit ${l.title}`}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </Link>
                    )}
                    {confirmDelete === l.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(l.id)}
                          className="h-8 cursor-pointer rounded-lg bg-destructive px-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(null)} className="h-8 cursor-pointer rounded-lg px-2 text-xs text-muted-foreground">
                          Keep
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(l.id)}
                        aria-label={`Delete ${l.title}`}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
