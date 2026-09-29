"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ImagePlus, Loader2, Plus, Video, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { createListing, updateListing, type Listing, type ListingInput, type PropertyType } from "@/lib/api";
import { AREAS_BY_STATE } from "@/lib/locations";
import { cn } from "@/lib/utils";
import { ErrorBanner, PageHeader } from "@/components/dashboards/ui";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment / flat" },
  { value: "house", label: "House" },
  { value: "duplex", label: "Duplex" },
  { value: "shortlet", label: "Shortlet" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
];

const COMMON_AMENITIES = [
  "24/7 power",
  "Water supply",
  "Security",
  "Parking",
  "Air conditioning",
  "Fitted kitchen",
  "Serviced",
  "Swimming pool",
  "Gym",
  "Balcony",
  "Boys' quarters",
  "Elevator",
  "CCTV",
  "Internet",
];

const input =
  "h-11 w-full rounded-xl border border-border bg-secondary/50 px-3.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background";

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border bg-card p-5 shadow-soft duration-500 sm:p-7">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center gap-3 text-sm font-medium"
    >
      <span className={cn("relative h-6 w-10 rounded-full transition-colors", checked ? "bg-primary" : "bg-secondary ring-1 ring-border")}>
        <span className={cn("absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
      </span>
      {label}
    </button>
  );
}

function UrlList({ values, onChange, placeholder, icon: Icon, preview }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; icon: typeof ImagePlus; preview?: boolean }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  function add() {
    const url = draft.trim();
    if (!url) return;
    if (!/^https:\/\/\S+$/i.test(url)) return setError("Use a full https:// link.");
    if (values.includes(url)) return setError("Already added.");
    onChange([...values, url]);
    setDraft("");
    setError("");
  }
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={input}
          inputMode="url"
        />
        <button type="button" onClick={add} className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
          <Icon className="size-4" /> Add
        </button>
      </div>
      {error && <div className="mt-1.5 text-xs text-destructive">{error}</div>}
      {values.length > 0 && (
        <ul className={cn("mt-3", preview ? "grid grid-cols-2 gap-3 sm:grid-cols-4" : "flex flex-col gap-2")}>
          {values.map((url, i) => (
            <li key={url} className={cn("group relative", !preview && "flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs")}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full rounded-xl border border-border object-cover" />
              ) : (
                <span className="min-w-0 flex-1 truncate">{url}</span>
              )}
              {preview && i === 0 && <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== url))}
                aria-label="Remove"
                className={cn(
                  "flex size-6 cursor-pointer items-center justify-center rounded-full",
                  preview ? "absolute top-2 right-2 bg-black/60 text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ListingEditor({ basePath, listing }: { basePath: string; listing?: Listing }) {
  const token = useAppStore((s) => s.token);
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = !!listing;

  const [form, setForm] = useState<ListingInput>({
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    type: listing?.type ?? "rent",
    propertyType: listing?.propertyType ?? "apartment",
    furnished: listing?.furnished ?? false,
    address: listing?.address ?? "",
    location: listing?.location ?? "",
    price: { currency: "NGN", amount: listing?.price.amount ?? 0 },
    negotiable: listing?.negotiable ?? false,
    beds: listing?.beds ?? 0,
    baths: listing?.baths ?? 0,
    sqft: listing?.sqft ?? 0,
    amenities: listing?.amenities ?? [],
    photos: listing?.photos ?? [],
    videos: listing?.videos ?? [],
    availabilityDates: listing?.availabilityDates ?? [],
  });
  const [customAmenity, setCustomAmenity] = useState("");
  const [date, setDate] = useState("");
  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const locationOptions = useMemo(
    () =>
      Object.entries(AREAS_BY_STATE).flatMap(([state, areas]) => {
        const short = state.replace(", Nigeria", "");
        return [short, ...areas.map((a) => `${a}, ${short}`)];
      }),
    []
  );

  const save = useMutation({
    mutationFn: () => (editing ? updateListing(token!, listing.id, form) : createListing(token!, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", "mine"] });
      router.push(`${basePath}/listings`);
    },
  });

  const isLand = form.propertyType === "land";

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={editing ? "Edit listing" : "New listing"}
        title={editing ? listing.title : "List a property"}
        description={editing ? "Changes go live as soon as you save." : "Your listing goes live as soon as you publish it."}
      />

      {listing?.status === "removed" && (
        <ErrorBanner message={`Housify removed this listing${listing.moderationNote ? `: ${listing.moderationNote}` : "."} It can't be edited.`} />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Card title="The basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Bright 3-bed flat with pool in Lekki Phase 1" required maxLength={140} />
            </Field>
            <Field label="Listing for">
              <div className="flex h-11 gap-1 rounded-xl border border-border bg-secondary/50 p-1">
                {(["rent", "sale"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={form.type === t}
                    onClick={() => set("type", t)}
                    className={cn("flex-1 cursor-pointer rounded-lg text-sm font-semibold transition-colors", form.type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                  >
                    {t === "rent" ? "Rent" : "Sale"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Property type">
              <select className={input} value={form.propertyType} onChange={(e) => set("propertyType", e.target.value as PropertyType)}>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2" hint="What makes it special, what's included, and anything a renter or buyer should know.">
              <textarea className={cn(input, "h-auto min-h-[140px] py-3")} value={form.description} onChange={(e) => set("description", e.target.value)} required maxLength={5000} />
            </Field>
            {!isLand && <Toggle checked={form.furnished} onChange={(v) => set("furnished", v)} label="Furnished" />}
          </div>
        </Card>

        <Card title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area" hint="Shown publicly, e.g. “Lekki, Lagos”.">
              <input className={input} list="housify-locations" value={form.location} onChange={(e) => set("location", e.target.value)} required maxLength={120} />
              <datalist id="housify-locations">
                {locationOptions.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Field>
            <Field label="Street address" hint="Shown on the listing page.">
              <input className={input} value={form.address} onChange={(e) => set("address", e.target.value)} required maxLength={300} autoComplete="street-address" />
            </Field>
          </div>
        </Card>

        <Card title="Price & size">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={form.type === "rent" ? "Rent per year (₦)" : "Asking price (₦)"} className="sm:col-span-2">
              <input
                className={input}
                inputMode="numeric"
                value={form.price.amount ? form.price.amount.toLocaleString("en-US") : ""}
                onChange={(e) => set("price", { currency: "NGN", amount: Number(e.target.value.replace(/[^\d]/g, "")) || 0 })}
                required
                placeholder="0"
              />
            </Field>
            <div className="flex items-end pb-2.5">
              <Toggle checked={form.negotiable} onChange={(v) => set("negotiable", v)} label="Negotiable" />
            </div>
            {!isLand && (
              <>
                <Field label="Bedrooms">
                  <input className={input} type="number" min={0} max={100} value={form.beds} onChange={(e) => set("beds", Number(e.target.value))} />
                </Field>
                <Field label="Bathrooms">
                  <input className={input} type="number" min={0} max={100} value={form.baths} onChange={(e) => set("baths", Number(e.target.value))} />
                </Field>
              </>
            )}
            <Field label="Size (sq ft)">
              <input className={input} type="number" min={0} value={form.sqft} onChange={(e) => set("sqft", Number(e.target.value))} />
            </Field>
          </div>
        </Card>

        {!isLand && (
          <Card title="Amenities" description="Pick everything that applies.">
            <div className="flex flex-wrap gap-2">
              {[...new Set([...COMMON_AMENITIES, ...form.amenities])].map((a) => {
                const on = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("amenities", on ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])}
                    className={cn(
                      "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      on ? "border-primary bg-primary/10 font-medium text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex max-w-sm gap-2">
              <input className={input} value={customAmenity} onChange={(e) => setCustomAmenity(e.target.value)} placeholder="Add another…" maxLength={60} />
              <button
                type="button"
                onClick={() => {
                  const a = customAmenity.trim();
                  if (a && !form.amenities.includes(a)) set("amenities", [...form.amenities, a]);
                  setCustomAmenity("");
                }}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-xl border border-border px-3 transition-colors hover:text-primary"
                aria-label="Add amenity"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Card>
        )}

        <Card title="Photos & video" description="Paste https:// links to your images. The first photo is the cover. Direct uploads are coming soon.">
          <div className="flex flex-col gap-6">
            <UrlList values={form.photos} onChange={(v) => set("photos", v)} placeholder="https://…/living-room.jpg" icon={ImagePlus} preview />
            <UrlList values={form.videos} onChange={(v) => set("videos", v)} placeholder="Video tour link (YouTube, Vimeo…)" icon={Video} />
          </div>
        </Card>

        <Card title="Viewing availability" description="Dates you're available to show the property.">
          <div className="flex max-w-sm gap-2">
            <input className={input} type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
            <button
              type="button"
              onClick={() => {
                if (date && !form.availabilityDates.includes(date)) set("availabilityDates", [...form.availabilityDates, date].sort());
                setDate("");
              }}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm font-semibold transition-colors hover:text-primary"
            >
              <CalendarPlus className="size-4" /> Add
            </button>
          </div>
          {form.availabilityDates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.availabilityDates.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
                  {new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  <button type="button" aria-label="Remove date" onClick={() => set("availabilityDates", form.availabilityDates.filter((x) => x !== d))} className="cursor-pointer text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {save.isError && <ErrorBanner message={save.error.message} />}

        <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-2xl border border-border bg-background/85 p-3 shadow-soft backdrop-blur-xl lg:bottom-4">
          <button type="button" onClick={() => router.back()} className="h-10 cursor-pointer rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            type="submit"
            disabled={save.isPending || listing?.status === "removed"}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Publish listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
