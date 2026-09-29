"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, MapPin, Search, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const AREAS = [
  "Lekki",
  "Ikoyi",
  "Victoria Island",
  "Banana Island",
  "Ikeja GRA",
  "Ajah",
  "Yaba",
  "Surulere",
  "Maitama, Abuja",
  "Asokoro, Abuja",
  "Gwarinpa, Abuja",
  "Wuse 2, Abuja",
  "GRA, Port Harcourt",
];

const TYPES = [
  { value: "", label: "Any type" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "duplex", label: "Duplex" },
  { value: "shortlet", label: "Shortlet" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const BUDGETS = {
  rent: [
    { label: "Any budget", min: "", max: "" },
    { label: "Up to ₦2M / yr", min: "", max: "2000000" },
    { label: "₦2M – ₦5M / yr", min: "2000000", max: "5000000" },
    { label: "₦5M – ₦10M / yr", min: "5000000", max: "10000000" },
    { label: "₦10M – ₦25M / yr", min: "10000000", max: "25000000" },
    { label: "₦25M+ / yr", min: "25000000", max: "" },
  ],
  sale: [
    { label: "Any budget", min: "", max: "" },
    { label: "Up to ₦50M", min: "", max: "50000000" },
    { label: "₦50M – ₦150M", min: "50000000", max: "150000000" },
    { label: "₦150M – ₦500M", min: "150000000", max: "500000000" },
    { label: "₦500M – ₦1B", min: "500000000", max: "1000000000" },
    { label: "₦1B+", min: "1000000000", max: "" },
  ],
};

const field =
  "h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground";

export function HeroSearch() {
  const router = useRouter();
  const [type, setType] = useState<"rent" | "sale">("rent");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const b = BUDGETS[type][budget];
    const params = new URLSearchParams({ type });
    if (location.trim()) params.set("location", location.trim());
    if (propertyType) params.set("propertyType", propertyType);
    if (b.min) params.set("minPrice", b.min);
    if (b.max) params.set("maxPrice", b.max);
    router.push(`/browse?${params}`);
  }

  return (
    <div className="w-full max-w-[760px]">
      <div role="tablist" aria-label="Rent or buy" className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md">
        {(["rent", "sale"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            onClick={() => {
              setType(t);
              setBudget(0);
            }}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-all",
              type === t ? "bg-white text-[#0b0d12] shadow" : "text-white/80 hover:text-white"
            )}
          >
            {t === "rent" ? "Rent" : "Buy"}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-1 rounded-3xl bg-card/95 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/20 backdrop-blur-xl md:grid-cols-[1.4fr_1fr_1fr_auto] md:rounded-full"
      >
        <label className="flex h-14 items-center gap-3 rounded-2xl px-4 transition-colors focus-within:bg-secondary md:rounded-full">
          <MapPin className="size-5 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold text-muted-foreground">Where</span>
            <input
              list="hero-areas"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lekki, Ikoyi, Maitama…"
              aria-label="Area or city"
              className={cn(field, "cursor-text")}
            />
          </span>
          <datalist id="hero-areas">
            {AREAS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </label>

        <label className="flex h-14 items-center gap-3 rounded-2xl px-4 transition-colors focus-within:bg-secondary md:rounded-full md:border-l md:border-border">
          <Building className="size-5 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold text-muted-foreground">Property type</span>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} aria-label="Property type" className={field}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex h-14 items-center gap-3 rounded-2xl px-4 transition-colors focus-within:bg-secondary md:rounded-full md:border-l md:border-border">
          <Wallet className="size-5 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold text-muted-foreground">Budget</span>
            <select value={budget} onChange={(e) => setBudget(Number(e.target.value))} aria-label="Budget" className={field}>
              {BUDGETS[type].map((b, i) => (
                <option key={b.label} value={i}>
                  {b.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <button
          type="submit"
          className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 active:scale-[0.98] md:rounded-full"
        >
          <Search className="size-5" />
          Search
        </button>
      </form>
    </div>
  );
}
