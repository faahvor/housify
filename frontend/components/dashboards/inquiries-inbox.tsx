"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getReceivedInquiries, updateInquiry, type Inquiry, type InquiryStatus } from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ListingThumb } from "@/components/dashboards/listing-thumb";
import { EmptyState, ErrorBanner, PageHeader, Panel, RowSkeleton, StatusPill } from "@/components/dashboards/ui";

export const INQUIRY_STATUS: Record<InquiryStatus, { label: string; pill: string }> = {
  new: { label: "New", pill: "pending" },
  contacted: { label: "Contacted", pill: "active" },
  viewing_scheduled: { label: "Viewing scheduled", pill: "verified" },
  closed: { label: "Closed", pill: "paused" },
  declined: { label: "Declined", pill: "removed" },
};

export function useReceivedInquiries() {
  const token = useAppStore((s) => s.token);
  return useQuery({ queryKey: ["inquiries", "received"], queryFn: () => getReceivedInquiries(token!), enabled: !!token });
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const [note, setNote] = useState(inquiry.ownerNote ?? "");
  const update = useMutation({
    mutationFn: (patch: { status?: InquiryStatus; ownerNote?: string }) => updateInquiry(token!, inquiry.id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries", "received"] }),
  });

  return (
    <li className="px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-start gap-4">
        <ListingThumb src={inquiry.listing?.photo} alt={inquiry.listing?.title ?? "Listing"} className="size-14" />
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{inquiry.name}</span>
            <StatusPill status={INQUIRY_STATUS[inquiry.status].pill} label={INQUIRY_STATUS[inquiry.status].label} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {inquiry.listing ? `${inquiry.listing.title} · ${formatListingPrice(inquiry.listing)}` : "Deleted listing"}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {inquiry.phone && (
              <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Phone className="size-3.5" /> {inquiry.phone}
              </a>
            )}
            {inquiry.email && (
              <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="size-3.5" /> {inquiry.email}
              </a>
            )}
            {inquiry.requestedDate && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" /> Prefers {inquiry.requestedDate}
              </span>
            )}
          </div>
          {inquiry.message && <p className="mt-3 rounded-xl bg-secondary px-3.5 py-2.5 text-sm">{inquiry.message}</p>}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-[220px]">
          <span className="text-[11px] text-muted-foreground">Received {formatDate(inquiry.createdAt)}</span>
          <select
            aria-label="Inquiry status"
            value={inquiry.status}
            disabled={update.isPending}
            onChange={(e) => update.mutate({ status: e.target.value as InquiryStatus })}
            className="h-9 w-full cursor-pointer rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
          >
            {(Object.keys(INQUIRY_STATUS) as InquiryStatus[]).map((s) => (
              <option key={s} value={s}>
                {INQUIRY_STATUS[s].label}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (inquiry.ownerNote ?? "") && update.mutate({ ownerNote: note })}
            placeholder="Private note…"
            maxLength={1000}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
          />
          {update.isError && <span className="text-xs text-destructive">{update.error.message}</span>}
        </div>
      </div>
    </li>
  );
}

const FILTERS: { key: "open" | "all" | InquiryStatus; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "new", label: "New" },
  { key: "viewing_scheduled", label: "Viewings" },
  { key: "all", label: "All" },
];

export function InquiriesInbox({ description }: { description: string }) {
  const { data, isLoading, isError, refetch } = useReceivedInquiries();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("open");
  const all = data ?? [];
  const visible = all.filter((i) =>
    filter === "all" ? true : filter === "open" ? i.status !== "closed" && i.status !== "declined" : i.status === filter
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader eyebrow="Leads" title="Inquiries" description={description} />
      {isError && <ErrorBanner message="We couldn't load your inquiries." onRetry={() => refetch()} />}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-soft scrollbar-none sm:inline-flex">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={all.length === 0 ? "No inquiries yet" : "Nothing in this view"}
            description={all.length === 0 ? "When someone asks about one of your listings, you'll be notified and it will appear here." : "Try another filter."}
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((i) => (
              <InquiryCard key={i.id} inquiry={i} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
