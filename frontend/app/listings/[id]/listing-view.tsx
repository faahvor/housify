"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  Loader2,
  Map,
  MapPin,
  Maximize,
  MessageCircle,
  Pencil,
  Phone,
  PlayCircle,
  Sofa,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getListing, searchListings, sendInquiry, type Listing, type ReportCategory } from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { DASHBOARD_ROUTE, ROLE_LABEL } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { useMe } from "@/components/dashboards/account-status";
import { ListingCard } from "@/components/listings/listing-card";
import { ReportButton, SaveButton, ShareButton } from "@/components/listings/actions";

const TYPE_LABEL: Record<Listing["propertyType"], string> = {
  apartment: "Apartment",
  house: "House",
  duplex: "Duplex",
  shortlet: "Shortlet",
  land: "Land",
  commercial: "Commercial",
  other: "Property",
};

/* ───────── Gallery ───────── */

function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const go = (d: number) => setIndex((i) => (i + d + photos.length) % photos.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/7] flex-col items-center justify-center gap-3 rounded-[28px] bg-gradient-to-br from-primary/20 via-primary/5 to-highlight/15 text-primary/70">
        <Building2 className="size-14" strokeWidth={1.3} />
        <span className="text-sm font-medium text-muted-foreground">The owner hasn&apos;t added photos yet</span>
      </div>
    );
  }

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const rest = photos.slice(1, 5);

  return (
    <>
      <div className={cn("grid gap-2 overflow-hidden rounded-[28px]", rest.length > 0 ? "md:grid-cols-4 md:grid-rows-2" : "")}>
        <button type="button" onClick={() => openAt(0)} className={cn("group relative cursor-zoom-in overflow-hidden", rest.length > 0 ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto" : "aspect-[16/7]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt={`${title} — photo 1`} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </button>
        {rest.map((src, i) => (
          <button key={src} type="button" onClick={() => openAt(i + 1)} className="group relative hidden aspect-[4/3] cursor-zoom-in overflow-hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${title} — photo ${i + 2}`} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            {i === rest.length - 1 && photos.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">+{photos.length - 5} more</span>
            )}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => openAt(0)} className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
        <Expand className="size-4" /> View all {photos.length} photos
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/95 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed inset-0 z-[80] flex flex-col text-white outline-none">
            <Dialog.Title className="sr-only">{title} photos</Dialog.Title>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-white/70">
                {index + 1} / {photos.length}
              </span>
              <Dialog.Close aria-label="Close gallery" className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={photos[index]} src={photos[index]} alt={`${title} — photo ${index + 1}`} className="animate-in fade-in max-h-full max-w-full rounded-xl object-contain duration-300" />
              {photos.length > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:left-4">
                    <ChevronLeft className="size-6" />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:right-4">
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>
            <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-5">
              {photos.map((src, i) => (
                <button key={src} type="button" onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`} className={cn("h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-2 transition", i === index ? "ring-white" : "opacity-50 ring-transparent hover:opacity-80")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/** YouTube/Vimeo links become embeds; anything else stays a link. */
function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/* ───────── Inquiry form ───────── */

const field =
  "h-11 w-full rounded-xl border border-border bg-secondary/50 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background";

function InquiryForm({ listing }: { listing: Listing }) {
  const token = useAppStore((s) => s.token);
  const role = useAppStore((s) => s.role);
  const { data: me } = useMe();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState(`Hi, I'm interested in “${listing.title}”. Is it still available?`);

  useEffect(() => {
    if (!me) return;
    setName((v) => v || me.name);
    setEmail((v) => v || me.email || "");
    setPhone((v) => v || me.phone || "");
  }, [me]);

  const send = useMutation({
    mutationFn: () => sendInquiry(listing.id, { name, email, phone, requestedDate: date || undefined, message }, token),
  });

  if (send.isSuccess) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <div className="font-semibold">Sent to {listing.owner?.name ?? "the owner"}</div>
        <p className="mt-1 text-sm text-muted-foreground">They&apos;ve been notified and will reply using your contact details.</p>
        {token && role ? (
          <Link href={`${DASHBOARD_ROUTE[role]}${role === "user" ? "/inquiries" : ""}`} className="mt-4 text-sm font-semibold text-primary hover:underline">
            Track it in your dashboard
          </Link>
        ) : (
          <Link href="/join?role=user" className="mt-4 text-sm font-semibold text-primary hover:underline">
            Create a free account to track replies
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
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" required maxLength={100} autoComplete="name" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" required autoComplete="email" />
        <input className={field} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" aria-label="Phone" required maxLength={30} autoComplete="tel" />
      </div>
      {listing.availabilityDates.length > 0 ? (
        <select className={field} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Preferred viewing date">
          <option value="">Preferred viewing date (optional)</option>
          {listing.availabilityDates.map((d) => (
            <option key={d} value={d}>
              {new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </option>
          ))}
        </select>
      ) : (
        <input className={field} type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} aria-label="Preferred viewing date (optional)" />
      )}
      <textarea className={cn(field, "h-auto min-h-[96px] py-3")} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} aria-label="Message" />
      {send.isError && (
        <div role="alert" className="text-sm text-destructive">
          {send.error.message}
        </div>
      )}
      <button type="submit" disabled={send.isPending} className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:opacity-60">
        {send.isPending && <Loader2 className="size-4 animate-spin" />}
        Send inquiry
      </button>
      <p className="text-center text-xs text-muted-foreground">Your details go only to the person who listed this home.</p>
    </form>
  );
}

/* ───────── Page ───────── */

function Fact({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block font-semibold">{value}</span>
      </span>
    </div>
  );
}

function waLink(number: string, title: string) {
  const digits = number.replace(/[^\d]/g, "").replace(/^0/, "234");
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hi, I saw “${title}” on Housify.`)}`;
}

export function ListingView({ id }: { id: string }) {
  const token = useAppStore((s) => s.token);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const { data: me } = useMe();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["listing", id, !!token],
    queryFn: () => getListing(id, token),
    enabled: hasHydrated,
    retry: false,
  });
  const listing = data?.listing;

  const similar = useQuery({
    queryKey: ["listings", "similar", id],
    queryFn: () => searchListings({ location: listing!.location.split(",")[0], type: listing!.type, limit: 4 }),
    enabled: !!listing,
  });

  if (!hasHydrated || isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8 h-6 w-40 rounded-lg bg-secondary" />
        <div className="aspect-[16/7] rounded-[28px] bg-secondary" />
        <div className="mt-8 h-10 w-2/3 rounded-lg bg-secondary" />
        <div className="mt-4 h-6 w-1/3 rounded-lg bg-secondary" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold">This home isn&apos;t available</h1>
        <p className="mt-2 max-w-md text-muted-foreground">{error?.message ?? "It may have been taken, paused by the owner or removed."}</p>
        <Link href="/browse" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow">
          Browse other homes
        </Link>
      </div>
    );
  }

  const owner = listing.owner;
  const isOwner = !!me && me.id === listing.ownerId;
  const isLand = listing.propertyType === "land";
  const others = (similar.data?.items ?? []).filter((l) => l.id !== listing.id).slice(0, 3);

  return (
    <>
      <Link href="/browse" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All homes
      </Link>

      {listing.status !== "active" && (
        <div role="status" className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Only you can see this listing right now — its status is <strong className="capitalize">{listing.status}</strong>.
          {listing.moderationNote && ` Housify: ${listing.moderationNote}`}
        </div>
      )}

      <Gallery photos={listing.photos} title={listing.title} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{listing.type === "rent" ? "For rent" : "For sale"}</span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{TYPE_LABEL[listing.propertyType]}</span>
            {listing.furnished && <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">Furnished</span>}
            {listing.negotiable && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Negotiable</span>}
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-semibold sm:text-[42px]">{listing.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {listing.location}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <SaveButton listingId={listing.id} />
            <ShareButton />
            {!isOwner && <ReportButton category="listing" targetId={listing.id} targetLabel={listing.title} />}
            {isOwner && me && (
              <Link href={`${DASHBOARD_ROUTE[me.role]}/listings/${listing.id}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                <Pencil className="size-4" /> Edit your listing
              </Link>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {!isLand && <Fact icon={BedDouble} label="Bedrooms" value={String(listing.beds)} />}
            {!isLand && <Fact icon={Bath} label="Bathrooms" value={String(listing.baths)} />}
            {listing.sqft > 0 && <Fact icon={Maximize} label="Size" value={`${listing.sqft.toLocaleString()} ft²`} />}
            <Fact icon={isLand ? Map : Sofa} label={isLand ? "Type" : "Furnishing"} value={isLand ? "Land" : listing.furnished ? "Furnished" : "Unfurnished"} />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">About this home</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-foreground/85">{listing.description}</p>
          </section>

          {listing.amenities.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Amenities</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {listing.videos.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Video tour</h2>
              <div className="mt-4 flex flex-col gap-4">
                {listing.videos.map((v) => {
                  const embed = videoEmbed(v);
                  if (/\.(mp4|mov|webm)(\?|$)/i.test(v)) {
                    return (
                      <video key={v} src={v} controls preload="metadata" playsInline className="aspect-video w-full rounded-2xl border border-border bg-black">
                        <track kind="captions" />
                      </video>
                    );
                  }
                  return embed ? (
                    <div key={v} className="aspect-video overflow-hidden rounded-2xl border border-border">
                      <iframe src={embed} title={`${listing.title} video tour`} className="size-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                    </div>
                  ) : (
                    <a key={v} href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                      <PlayCircle className="size-5" /> Watch the video tour
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Location</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
              <div>
                <div className="font-semibold">{listing.address}</div>
                <div className="text-sm text-muted-foreground">{listing.location}</div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.address}, ${listing.location}, Nigeria`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Map className="size-4" /> Open in Google Maps
              </a>
            </div>
          </section>

          {listing.availabilityDates.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Viewing dates</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {listing.availabilityDates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm">
                    <CalendarDays className="size-4 text-primary" />
                    {new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                ))}
              </div>
            </section>
          )}

          <p className="mt-10 text-xs text-muted-foreground">Listed {formatDate(listing.createdAt)} · Last updated {formatDate(listing.updatedAt)}</p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="font-display text-3xl font-semibold tracking-[-0.03em] tabular-nums">{formatListingPrice(listing)}</div>
            <div className="mt-1 text-sm text-muted-foreground">{listing.negotiable ? "Price is negotiable" : "Fixed price"}</div>

            {owner && (
              <div className="mt-6 border-t border-border pt-6">
                <Link href={`/pros/${owner.id}`} className="group flex items-center gap-3">
                  <Avatar name={owner.name} src={owner.avatarUrl} size={48} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold group-hover:text-primary">
                      <span className="truncate">{owner.name}</span>
                      {owner.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {ROLE_LABEL[owner.role]}
                      {owner.memberSince && ` · on Housify since ${new Date(owner.memberSince).getFullYear()}`}
                    </span>
                  </span>
                </Link>
                {!isOwner && (owner.phone || owner.whatsapp) && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {owner.phone && (
                      <a href={`tel:${owner.phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
                        <Phone className="size-4" /> Call
                      </a>
                    )}
                    {(owner.whatsapp || owner.phone) && (
                      <a
                        href={waLink(owner.whatsapp || owner.phone!, listing.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold transition-colors hover:border-emerald-400/60 hover:text-emerald-600"
                      >
                        <MessageCircle className="size-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isOwner && (
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="mb-4 font-sans text-base font-semibold tracking-normal">Ask about this home</h2>
                <InquiryForm listing={listing} />
              </div>
            )}
          </div>
          {!isOwner && owner && (
            <div className="mt-3 flex justify-center">
              <ReportButton category={owner.role as ReportCategory} targetId={owner.id} targetLabel={owner.name} label={`Report this ${ROLE_LABEL[owner.role].toLowerCase()}`} />
            </div>
          )}
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-20 border-t border-border pt-14">
          <h2 className="text-2xl font-semibold">More homes nearby</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
