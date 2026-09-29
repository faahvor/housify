"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BadgeCheck, Home, MapPin, RotateCw, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { searchListings, searchProfessionals, type ListingQuery, type PropertyType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import { Avatar } from "@/components/avatar";

const PAGE_SIZE = 12;

const PROPERTY_TYPES: { value: PropertyType | ""; label: string }[] = [
  { value: "", label: "Any type" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "duplex", label: "Duplex" },
  { value: "shortlet", label: "Shortlet" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const ROLE_TABS = [
  { value: "", label: "Everyone" },
  { value: "landlord", label: "Landlords" },
  { value: "agent", label: "Agents" },
  { value: "realtor", label: "Realtors" },
];

const input =
  "h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

/**
 * Reads/writes browse state in the URL so searches are shareable. Uses the native
 * History API (which Next.js keeps in sync with useSearchParams) so a filter
 * change never triggers a server round-trip.
 */
function useUrlState() {
  const params = useSearchParams();
  const pathname = usePathname();
  const get = (k: string) => params.get(k) ?? "";
  function set(patch: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }
  return { params, get, set };
}

function Filters({ onDone }: { onDone?: () => void }) {
  const { get, set } = useUrlState();
  const [location, setLocation] = useState(get("location"));
  const [minPrice, setMinPrice] = useState(get("minPrice"));
  const [maxPrice, setMaxPrice] = useState(get("maxPrice"));
  useEffect(() => setLocation(get("location")), [get("location")]); // eslint-disable-line react-hooks/exhaustive-deps

  const pill = (active: boolean) =>
    cn(
      "h-9 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 text-[13px] font-semibold">Looking to</div>
        <div className="flex gap-2">
          {[
            { v: "", l: "All" },
            { v: "rent", l: "Rent" },
            { v: "sale", l: "Buy" },
          ].map((o) => (
            <button key={o.l} type="button" className={pill(get("type") === o.v)} onClick={() => set({ type: o.v })}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          set({ location: location.trim() });
          onDone?.();
        }}
      >
        <label className="mb-2 block text-[13px] font-semibold" htmlFor="f-location">
          Area
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="f-location" className={cn(input, "pl-9")} value={location} onChange={(e) => setLocation(e.target.value)} onBlur={() => set({ location: location.trim() })} placeholder="e.g. Lekki, Maitama" />
        </div>
      </form>

      <div>
        <label className="mb-2 block text-[13px] font-semibold" htmlFor="f-type">
          Property type
        </label>
        <select id="f-type" className={input} value={get("propertyType")} onChange={(e) => set({ propertyType: e.target.value })}>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold">Price (₦)</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={input}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum price"
            value={minPrice ? Number(minPrice).toLocaleString() : ""}
            onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => set({ minPrice })}
          />
          <input
            className={input}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum price"
            value={maxPrice ? Number(maxPrice).toLocaleString() : ""}
            onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => set({ maxPrice })}
          />
        </div>
      </div>

      {(["beds", "baths"] as const).map((key) => (
        <div key={key}>
          <div className="mb-2 text-[13px] font-semibold">{key === "beds" ? "Bedrooms" : "Bathrooms"}</div>
          <div className="flex flex-wrap gap-2">
            {["", "1", "2", "3", "4", "5"].map((n) => (
              <button key={n || "any"} type="button" className={pill(get(key) === n)} onClick={() => set({ [key]: n })}>
                {n ? `${n}+` : "Any"}
              </button>
            ))}
          </div>
        </div>
      ))}

      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
        Furnished only
        <input type="checkbox" className="size-5 cursor-pointer accent-[var(--primary)]" checked={get("furnished") === "true"} onChange={(e) => set({ furnished: e.target.checked ? "true" : "" })} />
      </label>
    </div>
  );
}

function ActiveChips() {
  const { get, set } = useUrlState();
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === get("propertyType"))?.label;
  const chips = [
    get("type") && { key: "type", label: get("type") === "rent" ? "For rent" : "For sale" },
    get("location") && { key: "location", label: get("location") },
    get("propertyType") && { key: "propertyType", label: typeLabel ?? get("propertyType") },
    (get("minPrice") || get("maxPrice")) && {
      key: "price",
      label: `₦${get("minPrice") ? Number(get("minPrice")).toLocaleString() : "0"} – ${get("maxPrice") ? `₦${Number(get("maxPrice")).toLocaleString()}` : "any"}`,
    },
    get("beds") && { key: "beds", label: `${get("beds")}+ beds` },
    get("baths") && { key: "baths", label: `${get("baths")}+ baths` },
    get("furnished") && { key: "furnished", label: "Furnished" },
  ].filter(Boolean) as { key: string; label: string }[];

  if (chips.length === 0) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => set(c.key === "price" ? { minPrice: "", maxPrice: "" } : { [c.key]: "" })}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          {c.label}
          <X className="size-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => set({ type: "", location: "", propertyType: "", minPrice: "", maxPrice: "", beds: "", baths: "", furnished: "" })}
        className="cursor-pointer px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}

function HomesResults() {
  const { params, get, set } = useUrlState();
  const [drawer, setDrawer] = useState(false);
  const page = Number(get("page")) || 1;

  const query: ListingQuery = useMemo(
    () => ({
      q: get("q") || undefined,
      type: (get("type") as ListingQuery["type"]) || undefined,
      location: get("location") || undefined,
      propertyType: (get("propertyType") as PropertyType) || undefined,
      furnished: get("furnished") === "true" ? true : undefined,
      minPrice: Number(get("minPrice")) || undefined,
      maxPrice: Number(get("maxPrice")) || undefined,
      beds: Number(get("beds")) || undefined,
      baths: Number(get("baths")) || undefined,
      sort: (get("sort") as ListingQuery["sort"]) || "newest",
      page,
      limit: PAGE_SIZE,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.toString()]
  );

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["listings", "search", query],
    queryFn: () => searchListings(query),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterCount = ["type", "location", "propertyType", "minPrice", "maxPrice", "beds", "baths", "furnished"].filter((k) => get(k)).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Filters />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {isLoading ? "Searching…" : `${total.toLocaleString()} ${total === 1 ? "home" : "homes"} found`}
            {isFetching && !isLoading && <span className="ml-2 inline-block size-2 animate-pulse rounded-full bg-primary align-middle" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold lg:hidden"
            >
              <SlidersHorizontal className="size-4" /> Filters
              {filterCount > 0 && <span className="rounded-md bg-primary px-1.5 text-[11px] text-primary-foreground">{filterCount}</span>}
            </button>
            <select
              aria-label="Sort"
              value={get("sort") || "newest"}
              onChange={(e) => set({ sort: e.target.value === "newest" ? "" : e.target.value })}
              className="h-10 cursor-pointer rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ActiveChips />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
            <p className="text-muted-foreground">We couldn&apos;t load homes right now.</p>
            <button onClick={() => refetch()} className="mt-4 inline-flex cursor-pointer items-center gap-2 font-semibold text-primary">
              <RotateCw className="size-4" /> Try again
            </button>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Home className="size-6" />
            </span>
            <h2 className="text-xl font-semibold">{filterCount ? "No homes match these filters" : "No homes listed yet"}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {filterCount
                ? "Try widening your area or budget. New homes are added by landlords, agents and realtors every day."
                : "Every home on Housify is listed directly by its landlord, agent or realtor. Check back soon — or ask an agent to search for you."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/requests" className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow">
                Ask an agent to help
              </Link>
              <Link href="/list-property" className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-semibold hover:text-primary">
                List a property
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={cn("grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3", isFetching && "opacity-70")}>
              {data!.items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => set({ page: String(page - 1) }, false)}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="size-4" /> Previous
                </button>
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => set({ page: String(page + 1) }, false)}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ArrowRight className="size-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="animate-in fade-in absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="animate-in slide-in-from-bottom absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-background p-6 duration-300">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters" className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>
            <Filters onDone={() => setDrawer(false)} />
            <button type="button" onClick={() => setDrawer(false)} className="mt-8 h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              Show {total.toLocaleString()} {total === 1 ? "home" : "homes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { landlord: "Landlord", agent: "Agent", realtor: "Realtor" };

function PeopleResults() {
  const { get, set } = useUrlState();
  const [area, setArea] = useState(get("area"));
  const role = get("role");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["professionals", role, get("area")],
    queryFn: () => searchProfessionals({ role: role || undefined, area: get("area") || undefined, limit: 48 }),
  });
  const people = data?.items ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
          {ROLE_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              aria-pressed={role === t.value}
              onClick={() => set({ role: t.value })}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                role === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ area: area.trim() });
          }}
          className="relative w-full sm:w-72"
        >
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={cn(input, "pl-9")} value={area} onChange={(e) => setArea(e.target.value)} onBlur={() => set({ area: area.trim() })} placeholder="Area they cover, e.g. Lekki" aria-label="Area" />
        </form>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-secondary" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
          <p className="text-muted-foreground">We couldn&apos;t load professionals.</p>
          <button onClick={() => refetch()} className="mt-4 inline-flex cursor-pointer items-center gap-2 font-semibold text-primary">
            <RotateCw className="size-4" /> Try again
          </button>
        </div>
      ) : people.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </span>
          <h2 className="text-xl font-semibold">No professionals found</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">Try another area. Are you a landlord, agent or realtor yourself?</p>
          <Link href="/join" className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow">
            Join Housify
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/pros/${p.id}`}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} src={p.avatarUrl} size={48} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="truncate">{p.name}</span>
                      {p.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
                    </div>
                    <div className="text-sm text-muted-foreground">{ROLE_LABEL[p.role]}</div>
                  </div>
                </div>
                {p.bio && <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
                  {p.areasCovered.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {p.areasCovered.slice(0, 2).join(", ")}
                      {p.areasCovered.length > 2 && ` +${p.areasCovered.length - 2}`}
                    </span>
                  )}
                  <span>
                    {p.liveListings} live {p.liveListings === 1 ? "listing" : "listings"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BrowseView() {
  const { get, set } = useUrlState();
  const tab = get("tab") === "people" ? "people" : "homes";
  const [q, setQ] = useState(get("q"));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">{tab === "homes" ? "Find your next home" : "Find a professional"}</h1>
          <p className="mt-2 text-muted-foreground">
            {tab === "homes" ? "Every home here is listed directly by its landlord, agent or realtor." : "Landlords, agents and realtors on Housify. Verified professionals appear first."}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1 shadow-soft">
          {(["homes", "people"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => set({ tab: t === "homes" ? "" : "people" })}
              className={cn(
                "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "homes" ? "Homes" : "Professionals"}
            </button>
          ))}
        </div>
      </div>

      {tab === "homes" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: q.trim() });
          }}
          className="mb-8 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, street or area…"
              aria-label="Search homes"
              className="h-13 w-full rounded-2xl border border-border bg-card pr-4 pl-12 text-[15px] shadow-soft outline-none transition-colors focus:border-primary"
            />
          </div>
          <button type="submit" className="h-13 cursor-pointer rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow">
            Search
          </button>
        </form>
      )}

      {tab === "homes" ? <HomesResults /> : <PeopleResults />}
    </>
  );
}
