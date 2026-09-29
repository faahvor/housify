"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormInput, FormSelect, FormTextarea } from "@/components/form-input";
import { PasswordInput } from "@/components/password-input";
import { LOCATIONS } from "@/lib/locations";
import { useAppStore } from "@/lib/store";
import { register, createListing } from "@/lib/api";
import { DASHBOARD_ROUTE, LISTING_ROLES } from "@/lib/roles";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5.5 border-b border-primary pb-3.5 text-[22px] font-semibold">
      {children}
    </div>
  );
}

export function ListPropertyForm() {
  const router = useRouter();
  const role = useAppStore((s) => s.role);
  const loggedIn = useAppStore((s) => s.loggedIn);
  const token = useAppStore((s) => s.token);
  const logIn = useAppStore((s) => s.logIn);
  const setUser = useAppStore((s) => s.setUser);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const hasHydrated = useAppStore((s) => s.hasHydrated);
  // Signed-in landlords, agents and realtors list from their dashboard instead.
  // Set while this form signs someone up, so that sign-in doesn't trigger the redirect below.
  const [signingUpHere, setSigningUpHere] = useState(false);
  const canListAlready =
    loggedIn &&
    !!role &&
    LISTING_ROLES.includes(role) &&
    !!token &&
    !signingUpHere;

  useEffect(() => {
    if (hasHydrated && canListAlready && role)
      router.replace(`${DASHBOARD_ROUTE[role]}/listings/new`);
  }, [hasHydrated, canListAlready, role, router]);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"rent" | "sale">("rent");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [photoCount, setPhotoCount] = useState(2);
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [dates, setDates] = useState("");

  if (canListAlready) return null;

  if (loggedIn && (role === "user" || role === "admin")) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-soft">
        <div className="mb-3 text-2xl font-semibold">
          Listing needs a property account
        </div>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
          You&apos;re signed in with a{" "}
          {role === "user" ? "renter/buyer" : "admin"} account. To list a
          property, sign out and create a landlord, agent or realtor account.
        </p>
        <Link
          href="/join"
          className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          See account types
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary px-6 py-[100px] text-center">
        <div className="mb-4 text-[30px] font-bold">Your listing is live.</div>
        <div className="mb-7.5 opacity-70">
          Renters and buyers can now find your property. Manage it any time from
          your dashboard.
        </div>
        <button
          onClick={() => router.push("/landlord-dashboard")}
          className="inline-block cursor-pointer rounded-full bg-primary px-8 py-4 text-xs font-semibold tracking-[0.15em] text-primary-foreground uppercase"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!(Number(price) > 0)) {
      setSubmitError("Enter the price before submitting.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordError("");
    setSubmitError("");
    setSubmitting(true);

    setSigningUpHere(true);
    try {
      const { token: newToken, user } = await register({
        role: "landlord",
        name,
        email,
        password,
        phone,
      });
      logIn("landlord", newToken);
      setUser({
        name: user.name,
        phone,
        email,
        bio: "",
        states: [],
        areas: [],
      });

      await createListing(newToken, {
        title: address || "Untitled Listing",
        description: description || "No description provided.",
        type,
        address: city || address,
        location,
        price: { currency: "NGN", amount: Number(price) || 0 },
        negotiable,
        beds: Number(beds) || 0,
        baths: Number(baths) || 0,
        sqft: Number(sqft) || 0,
        availabilityDates: dates ? [dates] : [],
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to submit listing.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-14">
      <div>
        <SectionTitle>1. Property Details</SectionTitle>
        <div className="flex flex-col gap-4">
          <FormInput
            variant="light"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            required
          />
          <FormInput
            variant="light"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Neighborhood, city"
            required
          />
          <FormSelect
            variant="light"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="" disabled>
              State
            </option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </FormSelect>
          <FormTextarea
            variant="light"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the property"
            rows={3}
            required
          />
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setType("rent")}
              className={`flex-1 cursor-pointer rounded-full border px-5 py-4 text-[13px] font-semibold tracking-[0.1em] uppercase ${
                type === "rent"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              For Rent
            </button>
            <button
              type="button"
              onClick={() => setType("sale")}
              className={`flex-1 cursor-pointer rounded-full border px-5 py-4 text-[13px] font-semibold tracking-[0.1em] uppercase ${
                type === "sale"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              For Sale
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <FormInput
              variant="light"
              className="min-w-[120px] flex-1"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              placeholder="Beds"
              required
            />
            <FormInput
              variant="light"
              className="min-w-[120px] flex-1"
              value={baths}
              onChange={(e) => setBaths(e.target.value)}
              placeholder="Baths"
              required
            />
            <FormInput
              variant="light"
              className="min-w-[120px] flex-1"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              placeholder="Sqft"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>2. Photos &amp; Video</SectionTitle>
        <div className="mb-4 flex flex-wrap gap-3">
          {Array.from({ length: photoCount }).map((_, i) => (
            <div
              key={i}
              className="flex h-[110px] w-[110px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary text-2xl text-primary"
            >
              ✓
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPhotoCount((c) => Math.min(c + 1, 12))}
            className="flex h-[110px] w-[110px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary text-[26px] text-primary"
          >
            +
          </button>
        </div>
        <div className="text-[13px] opacity-50">
          Upload up to 12 photos or a short walkthrough video.
        </div>
      </div>

      <div>
        <SectionTitle>3. Pricing</SectionTitle>
        <div className="flex flex-wrap items-center gap-4">
          <FormInput
            variant="light"
            className="min-w-[200px] flex-1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (₦)"
            required
          />
          <button
            type="button"
            onClick={() => setNegotiable((n) => !n)}
            className="flex cursor-pointer items-center gap-3 rounded-full border border-primary px-5 py-4"
          >
            <span
              className={`relative h-5.5 w-10 flex-shrink-0 rounded-full transition-colors ${
                negotiable ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-background transition-all"
                style={{ left: negotiable ? "20px" : "2px" }}
              />
            </span>
            <span className="text-[13px] tracking-[0.1em] uppercase">
              {negotiable ? "Negotiable" : "Fixed Price"}
            </span>
          </button>
        </div>
      </div>

      {
        <div>
          <SectionTitle>4. Contact Details</SectionTitle>
          <div className="flex flex-col gap-4">
            <FormInput
              variant="light"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
            <div className="flex flex-wrap gap-4">
              <FormInput
                variant="light"
                className="min-w-[200px] flex-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone / WhatsApp"
                required
              />
              <FormInput
                variant="light"
                className="min-w-[200px] flex-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <PasswordInput
                variant="light"
                value={password}
                onChange={setPassword}
                placeholder="Create password"
                autoComplete="new-password"
              />
              <PasswordInput
                variant="light"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <div className="text-xs text-primary">{passwordError}</div>
            )}
            <div className="text-[12px] opacity-50">
              You&apos;ll use this email and password to sign in to your
              dashboard.
            </div>
          </div>
        </div>
      }

      <div>
        <SectionTitle>5. Available Viewing Times</SectionTitle>
        <FormTextarea
          variant="light"
          value={dates}
          onChange={(e) => setDates(e.target.value)}
          placeholder="e.g. Saturdays 11am–2pm, Wednesdays after 5pm"
          rows={2}
        />
      </div>

      {submitError && <div className="text-xs text-primary">{submitError}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="cursor-pointer rounded-full bg-primary px-4 py-5 text-center text-[13px] font-semibold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit Listing"}
      </button>
    </form>
  );
}
