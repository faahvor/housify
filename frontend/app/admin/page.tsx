"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, CircleCheck, Flag, ShieldAlert, Users } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getAdminAgents, getAdminLandlords, getAdminListings, getAdminRealtors, getAdminStats } from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { ListingThumb } from "@/components/dashboards/listing-thumb";
import {
  DistributionBar,
  EmptyState,
  ErrorBanner,
  Metric,
  PageHeader,
  Panel,
  RowSkeleton,
  StatusPill,
} from "@/components/dashboards/ui";

function useAdmin<T>(key: string, fn: (token: string) => Promise<T>) {
  const token = useAppStore((s) => s.token);
  return useQuery({ queryKey: ["admin", key], queryFn: () => fn(token!), enabled: !!token });
}

export default function AdminOverviewPage() {
  const stats = useAdmin("stats", getAdminStats);
  const listings = useAdmin("listings", getAdminListings);
  const landlords = useAdmin("landlords", getAdminLandlords);
  const agents = useAdmin("agents", getAdminAgents);
  const realtors = useAdmin("realtors", getAdminRealtors);

  const s = stats.data;
  const loading = stats.isLoading;
  const otherListings = s ? s.totalListings - s.activeListings - s.pausedListings - s.pendingListings : 0;

  const queue = [
    ...(landlords.data ?? []).map((u) => ({ ...u, role: "Landlord" })),
    ...(agents.data ?? []).map((u) => ({ ...u, role: "Agent" })),
    ...(realtors.data ?? []).map((u) => ({ ...u, role: "Realtor" })),
  ]
    .filter((u) => !u.verified && u.status === "active")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const queueLoading = landlords.isLoading || agents.isLoading || realtors.isLoading;

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader eyebrow={today} title="Platform overview" description="Everything happening across Housify, live from the database." />

      {stats.isError && <ErrorBanner message="We couldn't load platform stats." onRetry={() => stats.refetch()} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#4338ca] to-[#312e81] p-6 text-white shadow-glow duration-500 md:col-span-2">
          <div className="bg-grid absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/75">Members</span>
              <Users className="size-5 text-white/60" />
            </div>
            <div className="mt-4 font-display text-[52px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
              {loading ? "–" : s?.totalUsers ?? 0}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Members", value: s?.totalMembers, role: "user" },
                { label: "Landlords", value: s?.totalLandlords, role: "landlord" },
                { label: "Agents", value: s?.totalAgents, role: "agent" },
                { label: "Realtors", value: s?.totalRealtors, role: "realtor" },
              ].map((r) => (
                <Link key={r.label} href={`/admin/people?role=${r.role}`} className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur transition-colors hover:bg-white/20">
                  <div className="text-xs text-white/70">{r.label}</div>
                  <div className="mt-0.5 font-display text-xl font-semibold tabular-nums">{loading ? "–" : r.value ?? 0}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Metric
          label="Open reports"
          value={s?.openReports ?? 0}
          icon={Flag}
          hint={s ? `${s.reviewingReports} under review` : undefined}
          loading={loading}
          delay={60}
        />
        <Metric
          label="Awaiting verification"
          value={s?.pendingApprovals ?? 0}
          icon={ShieldAlert}
          hint={s ? `${s.suspendedAccounts} suspended · ${s.activeListings}/${s.totalListings} listings live` : "Unverified professionals"}
          loading={loading}
          delay={120}
        />

        <Panel title="Listing health" description="Status of every listing on the platform" className="md:col-span-2 xl:col-span-4" delay={180}>
          {loading || !s ? (
            <RowSkeleton rows={1} />
          ) : (
            <DistributionBar
              segments={[
                { label: "Live", value: s.activeListings, colorClass: "bg-success" },
                { label: "Paused", value: s.pausedListings, colorClass: "bg-warning" },
                { label: "In review", value: s.pendingListings, colorClass: "bg-highlight" },
                ...(otherListings > 0 ? [{ label: "Removed", value: otherListings, colorClass: "bg-destructive" }] : []),
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title="Latest listings"
          description="Newest properties across all owners"
          action={(listings.data?.length ?? 0) > 0 ? { label: "View all", href: "/admin/listings" } : undefined}
          className="lg:col-span-3"
          delay={240}
        >
          {listings.isLoading ? (
            <RowSkeleton />
          ) : (listings.data ?? []).length === 0 ? (
            <EmptyState compact icon={Building2} title="No listings yet" description="Listings created by landlords and realtors will appear here." />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {listings.data!.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center gap-4 py-3">
                  <ListingThumb src={l.photo} alt={l.title} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {l.landlordName} · {formatDate(l.createdAt)}
                    </div>
                  </div>
                  <div className="hidden text-sm font-semibold tabular-nums sm:block">{formatListingPrice(l)}</div>
                  <StatusPill status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Verification queue" description="Newest unverified professionals" className="lg:col-span-2" delay={300}>
          {queueLoading ? (
            <RowSkeleton />
          ) : queue.length === 0 ? (
            <EmptyState compact icon={CircleCheck} title="All caught up" description="Every landlord, agent and realtor account is verified." />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {queue.slice(0, 5).map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/people/${u.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-secondary/60">
                  <Avatar name={u.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{u.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.role} · joined {formatDate(u.createdAt)}
                    </div>
                  </div>
                  <StatusPill status="pending" label="Unverified" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
