"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Users, Building2, Check, Search } from "lucide-react";
import { FormInput, FormTextarea } from "@/components/form-input";
import { MultiSelectSearch } from "@/components/multi-select-search";
import { PasswordInput } from "@/components/password-input";
import { LOCATIONS, areasForStates } from "@/lib/locations";
import { useAppStore } from "@/lib/store";
import { register } from "@/lib/api";
import { DASHBOARD_ROUTE } from "@/lib/roles";

type Role = "user" | "landlord" | "agent" | "realtor";

const ROLE_OPTIONS: {
  key: Role;
  title: string;
  description: string;
  icon: typeof Home;
}[] = [
  {
    key: "user",
    title: "Renter or buyer",
    description: "Save homes, contact owners directly and track every request.",
    icon: Search,
  },
  {
    key: "landlord",
    title: "Landlord",
    description: "List and manage the properties you own.",
    icon: Home,
  },
  {
    key: "agent",
    title: "Agent",
    description: "Represent buyers and renters across the region.",
    icon: Users,
  },
  {
    key: "realtor",
    title: "Realtor",
    description: "List and manage properties on behalf of clients.",
    icon: Building2,
  },
];

const HEADINGS: Record<Role, { kicker: string; title: React.ReactNode }> = {
  user: {
    kicker: "For renters & buyers",
    title: (
      <>
        Find home, <span className="text-primary">minus the middlemen.</span>
      </>
    ),
  },
  landlord: {
    kicker: "For Landlords",
    title: (
      <>
        List with <span className="text-primary">confidence.</span>
      </>
    ),
  },
  agent: {
    kicker: "For Agents",
    title: (
      <>
        Represent buyers <span className="text-primary">and renters.</span>
      </>
    ),
  },
  realtor: {
    kicker: "For Realtors",
    title: (
      <>
        Grow your <span className="text-primary">portfolio.</span>
      </>
    ),
  },
};

const LOCATION_COPY: Record<
  Exclude<Role, "user">,
  { statesLabel: string; areasLabel: string; areasPlaceholder: string }
> = {
  landlord: {
    statesLabel: "Which state(s) do you have properties in?",
    areasLabel: "Which areas are your properties in?",
    areasPlaceholder: "Search areas, e.g. Lekki, Ikeja…",
  },
  agent: {
    statesLabel: "Which state(s) do you operate in?",
    areasLabel: "Which areas do you cover?",
    areasPlaceholder: "Search areas you cover…",
  },
  realtor: {
    statesLabel: "Which state(s) do you operate in?",
    areasLabel: "Which areas do you cover?",
    areasPlaceholder: "Search areas you cover…",
  },
};

const BIO_COPY: Record<
  Exclude<Role, "user">,
  { title: string; placeholder: string }
> = {
  landlord: {
    title: "About You",
    placeholder:
      "Tell renters or buyers a little about you and your properties",
  },
  agent: {
    title: "Experience & Bio",
    placeholder: "Tell us about your experience",
  },
  realtor: {
    title: "Experience & Bio",
    placeholder: "Tell us about your experience",
  },
};

function SectionTitle({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 border-b border-border pb-3.5">
      <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
        {n}
      </span>
      <span className="text-[20px] font-semibold">{children}</span>
    </div>
  );
}

export function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logIn = useAppStore((s) => s.logIn);
  const setUser = useAppStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const preselected = searchParams.get("role") as Role | null;
  const [role, setRole] = useState<Role | null>(
    preselected && ROLE_OPTIONS.some((r) => r.key === preselected)
      ? preselected
      : null,
  );
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const areaOptions = useMemo(() => areasForStates(states), [states]);

  function handleStatesChange(next: string[]) {
    setStates(next);
    const stillValid = areasForStates(next);
    setAreas((prev) => prev.filter((a) => stillValid.includes(a)));
  }

  if (!role) {
    return (
      <>
        <h1 className="mb-16 text-center text-[34px] leading-[1.05] font-bold sm:text-[46px] lg:text-[58px]">
          How will you
          <br />
          <span className="text-primary">work with us?</span>
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ROLE_OPTIONS.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5.5" strokeWidth={2} />
                </div>
                <div className="mb-3 text-2xl font-bold">{r.title}</div>
                <div className="text-[13px] leading-relaxed opacity-65">
                  {r.description}
                </div>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-card px-6 py-[100px] text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-7" strokeWidth={2.5} />
        </div>
        <div className="mb-4 text-[30px] font-bold">
          {role === "user" ? "Welcome to Housify." : "Application received."}
        </div>
        <div className="mb-7.5 opacity-70">
          {role === "user"
            ? "Your account is ready. Start saving homes and contacting owners directly."
            : "Your dashboard is ready to use. We'll review your details and add a verified badge to your profile."}
        </div>
        <button
          onClick={() => router.push(DASHBOARD_ROUTE[role])}
          className="inline-block cursor-pointer rounded-full bg-primary px-8 py-4 text-center text-[13px] font-semibold tracking-[0.2em] text-primary-foreground uppercase"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const heading = HEADINGS[role];
  const professional = role !== "user";
  const locationCopy = professional ? LOCATION_COPY[role] : null;
  const bioCopy = professional ? BIO_COPY[role] : null;

  return (
    <>
      <div className="mb-4.5 text-center text-xs font-semibold tracking-[0.3em] text-primary uppercase">
        {heading.kicker}
      </div>
      <h1 className="mb-10 text-center text-[34px] leading-[1.05] font-bold sm:text-[46px] lg:text-[58px]">
        {heading.title}
      </h1>

      <button
        onClick={() => setRole(null)}
        className="mb-8 cursor-pointer text-xs font-semibold tracking-[0.1em] text-primary uppercase"
      >
        ← Change role
      </button>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
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
            try {
              const { token, user } = await register({
                role,
                name,
                email,
                password,
                phone: phone || undefined,
                ...(professional && { bio, states, areasCovered: areas }),
              });
              queryClient.clear();
              logIn(role, token);
              setUser({ name: user.name, phone, email, bio, states, areas });
              setSubmitted(true);
            } catch (err) {
              setSubmitError(
                err instanceof Error
                  ? err.message
                  : "Unable to submit application.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="flex flex-col gap-12"
        >
          <div>
            <SectionTitle n={1}>Contact Details</SectionTitle>
            <div className="flex flex-col gap-4">
              <FormInput
                variant="solid"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
              />
              <div className="flex flex-wrap gap-4">
                <FormInput
                  variant="solid"
                  className="min-w-[200px] flex-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={
                    professional ? "Phone / WhatsApp" : "Phone (optional)"
                  }
                  autoComplete="tel"
                  required={professional}
                />
                <FormInput
                  variant="solid"
                  className="min-w-[200px] flex-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Create password"
                  autoComplete="new-password"
                />
                <PasswordInput
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

          {locationCopy && bioCopy && (
            <>
              <div>
                <SectionTitle n={2}>Location</SectionTitle>
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="mb-2.5 text-[13px] opacity-70">
                      {locationCopy.statesLabel}
                    </div>
                    <MultiSelectSearch
                      variant="solid"
                      options={LOCATIONS}
                      value={states}
                      onChange={handleStatesChange}
                      placeholder="Search states…"
                    />
                  </div>

                  <div>
                    <div className="mb-2.5 text-[13px] opacity-70">
                      {locationCopy.areasLabel}
                    </div>
                    <MultiSelectSearch
                      variant="solid"
                      options={areaOptions}
                      value={areas}
                      onChange={setAreas}
                      disabled={states.length === 0}
                      disabledPlaceholder="Select a state first"
                      placeholder={locationCopy.areasPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle n={3}>{bioCopy.title}</SectionTitle>
                <FormTextarea
                  variant="solid"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={bioCopy.placeholder}
                  rows={4}
                />
              </div>
            </>
          )}

          {submitError && (
            <div className="text-xs text-primary">{submitError}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-full bg-primary px-4 py-5 text-center text-[13px] font-semibold tracking-[0.2em] text-primary-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting
              ? "Creating account…"
              : professional
                ? "Submit application"
                : "Create account"}
          </button>
        </form>
      </div>
    </>
  );
}
