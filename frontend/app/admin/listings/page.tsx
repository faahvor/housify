"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bath, BedDouble, Building2, MapPin, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getAdminListings, moderateListing, type AdminListing } from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ListingThumb } from "@/components/dashboards/listing-thumb";
import { SearchField } from "@/components/dashboards/admin-directory";
import { ConfirmDialog } from "@/components/dashboards/confirm-dialog";
import { EmptyState, ErrorBanner, PageHeader, Panel, RowSkeleton, StatusPill } from "@/components/dashboards/ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Live" },
  { key: "paused", label: "Paused" },
  { key: "pending", label: "In review" },
  { key: "removed", label: "Removed" },
] as const;

export default function AdminListingsPage() {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<{ listing: AdminListing; action: "remove" | "restore" } | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: () => getAdminListings(token!),
    enabled: !!token,
  });

  const moderate = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "remove" | "restore"; note: string }) =>
      moderateListing(token!, id, action === "remove" ? "removed" : "active", note || undefined),
    onSuccess: () => {
      setTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const listings = data ?? [];
  const q = query.trim().toLowerCase();
  const visible = listings
    .filter((l) => filter === "all" || l.status === filter)
    .filter((l) => !q || `${l.title} ${l.address} ${l.location} ${l.landlordName}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Marketplace"
        title="Listings"
        description="Every property on Housify, newest first. Removing a listing hides it and tells the owner why."
        actions={<SearchField value={query} onChange={setQuery} placeholder="Search title, area or owner…" />}
      />

      {isError && <ErrorBanner message="We couldn't load listings." onRetry={() => refetch()} />}

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-soft scrollbar-none sm:inline-flex">
        {FILTERS.map((f) => {
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
            title={listings.length === 0 ? "No listings yet" : "No matches"}
            description={listings.length === 0 ? "Listings created by landlords, agents and realtors will appear here." : "No listings match your filters."}
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-6">
                <ListingThumb src={l.photo} alt={l.title} className="size-14" />
                <div className="min-w-[220px] flex-1">
                  <div className="truncate text-[15px] font-semibold">{l.title}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{l.address}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BedDouble className="size-3.5" /> {l.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="size-3.5" /> {l.baths}
                    </span>
                    <span>·</span>
                    {l.ownerId ? (
                      <Link href={`/admin/people/${l.ownerId}`} className="font-medium text-primary hover:underline">
                        {l.landlordName}
                        {l.ownerRole && <span className="capitalize"> ({l.ownerRole})</span>}
                      </Link>
                    ) : (
                      <span>{l.landlordName}</span>
                    )}
                  </div>
                  {l.status === "removed" && l.moderationNote && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                      <ShieldAlert className="mt-px size-3.5 shrink-0" /> {l.moderationNote}
                    </div>
                  )}
                </div>
                <div className="w-[150px]">
                  <div className="text-sm font-semibold tabular-nums">{formatListingPrice(l)}</div>
                  <div className="text-[11px] text-muted-foreground">Listed {formatDate(l.createdAt)}</div>
                </div>
                <StatusPill status={l.status} />
                {l.status === "removed" ? (
                  <button
                    type="button"
                    onClick={() => setTarget({ listing: l, action: "restore" })}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:text-primary"
                  >
                    <RotateCcw className="size-3.5" /> Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTarget({ listing: l, action: "remove" })}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {target && (
        <ConfirmDialog
          open
          onOpenChange={(o) => {
            if (!o) {
              setTarget(null);
              moderate.reset();
            }
          }}
          title={target.action === "remove" ? `Remove “${target.listing.title}”?` : `Restore “${target.listing.title}”?`}
          description={
            target.action === "remove"
              ? "It will be hidden from everyone and the owner can't republish it. They'll see your reason."
              : "It goes live again and the owner is notified."
          }
          confirmLabel={target.action === "remove" ? "Remove listing" : "Restore"}
          tone={target.action === "remove" ? "danger" : "primary"}
          reason={target.action === "remove" ? { label: "Reason (shown to the owner)", required: true, placeholder: "e.g. Photos don't match the property." } : undefined}
          pending={moderate.isPending}
          error={moderate.error?.message}
          onConfirm={(note) => moderate.mutate({ id: target.listing.id, action: target.action, note })}
        />
      )}
    </div>
  );
}
