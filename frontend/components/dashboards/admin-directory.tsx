"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, Users } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getAdminAgents, getAdminLandlords, getAdminMembers, getAdminRealtors, type AdminPerson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { EmptyState, ErrorBanner, PageHeader, Panel, RowSkeleton, StatusPill } from "@/components/dashboards/ui";

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-soft transition-colors focus-within:border-primary/50 sm:w-72">
      <Search className="size-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

export function AccountStatusPill({ person }: { person: Pick<AdminPerson, "status" | "verified"> & { role?: string } }) {
  if (person.status === "suspended") return <StatusPill status="suspended" label="Suspended" />;
  if (person.status === "deactivated") return <StatusPill status="removed" label="Deactivated" />;
  if (person.role === "user") return <StatusPill status="active" label="Active" />;
  return person.verified ? <StatusPill status="verified" label="Verified" /> : <StatusPill status="pending" label="Unverified" />;
}

const TABS = [
  { key: "user", label: "Members", fetcher: getAdminMembers, detail: () => null },
  { key: "landlord", label: "Landlords", fetcher: getAdminLandlords, detail: (p: AdminPerson) => `${p.listingCount ?? 0} listings` },
  { key: "agent", label: "Agents", fetcher: getAdminAgents, detail: (p: AdminPerson) => (p.areasCovered ?? []).slice(0, 3).join(", ") || "No coverage set" },
  { key: "realtor", label: "Realtors", fetcher: getAdminRealtors, detail: (p: AdminPerson) => `${p.listingCount ?? 0} listings` },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "unverified", label: "Unverified" },
  { key: "suspended", label: "Suspended" },
  { key: "deactivated", label: "Deactivated" },
] as const;

export function PeopleDirectory() {
  const token = useAppStore((s) => s.token);
  const router = useRouter();
  const params = useSearchParams();
  const tabKey = (TABS.some((t) => t.key === params.get("role")) ? params.get("role") : "landlord") as TabKey;
  const tab = TABS.find((t) => t.key === tabKey)!;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["key"]>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "people", tabKey],
    queryFn: () => tab.fetcher(token!),
    enabled: !!token,
  });

  const people = data ?? [];
  const q = query.trim().toLowerCase();
  const visible = people
    .filter((p) =>
      status === "all" ? true : status === "unverified" ? !p.verified && p.status === "active" && tabKey !== "user" : p.status === status
    )
    .filter((p) => !q || `${p.name} ${p.email ?? ""} ${p.phone}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Directory"
        title="People"
        description="Everyone on Housify. Open an account to verify, suspend or review it."
        actions={<SearchField value={query} onChange={setQuery} placeholder="Search name, email or phone…" />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-soft scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tabKey === t.key}
              onClick={() => router.replace(`/admin/people?role=${t.key}`)}
              className={cn(
                "shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                tabKey === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 cursor-pointer rounded-xl border border-border bg-card px-3 text-sm shadow-soft outline-none"
        >
          {STATUS_FILTERS.filter((f) => !(tabKey === "user" && f.key === "unverified")).map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        {!isLoading && <span className="text-sm text-muted-foreground">{visible.length} of {people.length}</span>}
      </div>

      {isError && <ErrorBanner message={`We couldn't load ${tab.label.toLowerCase()}.`} onRetry={() => refetch()} />}

      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton rows={4} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title={people.length === 0 ? `No ${tab.label.toLowerCase()} yet` : "No matches"}
            description={people.length === 0 ? "Accounts will appear here as people sign up." : "Try a different search or filter."}
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/people/${p.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/50 sm:px-6">
                  <Avatar name={p.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.email ?? "—"}
                      {p.phone && ` · ${p.phone}`}
                    </div>
                  </div>
                  <div className="hidden w-[200px] truncate text-sm text-muted-foreground md:block">{tab.detail(p)}</div>
                  <div className="hidden w-[110px] text-sm text-muted-foreground lg:block">{formatDate(p.createdAt)}</div>
                  <AccountStatusPill person={{ ...p, role: tabKey }} />
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
