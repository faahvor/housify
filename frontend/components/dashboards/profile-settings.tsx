"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, Clock, Loader2, TriangleAlert } from "lucide-react";
import { FormInput, FormTextarea } from "@/components/form-input";
import { MultiSelectSearch } from "@/components/multi-select-search";
import { PasswordInput } from "@/components/password-input";
import { AvatarUploader } from "@/components/dashboards/avatar-uploader";
import { useAppStore } from "@/lib/store";
import { changePassword, deactivateAccount, updateMe, type MeUser, type ProfilePatch } from "@/lib/api";
import { LOCATIONS, areasForStates } from "@/lib/locations";
import { ROLE_LABEL } from "@/lib/roles";
import { useMe } from "@/components/dashboards/account-status";
import { ErrorBanner, PageHeader, Skeleton } from "@/components/dashboards/ui";

const COPY = {
  landlord: { states: "Which state(s) do you have properties in?", areas: "Which areas are your properties in?", bio: "Tell renters and buyers a little about you and your properties." },
  agent: { states: "Which state(s) do you operate in?", areas: "Which areas do you cover?", bio: "Your experience, specialties and how you work with clients." },
  realtor: { states: "Which state(s) do you operate in?", areas: "Which areas do you cover?", bio: "Your experience, licences and the kinds of properties you represent." },
} as const;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-border py-8 first:pt-0 last:border-0 md:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[13px] font-medium text-muted-foreground">{children}</div>;
}

const saveButton =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-wait disabled:opacity-60";

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span role="status" className="animate-in fade-in inline-flex items-center gap-1.5 text-sm font-medium text-success">
      <Check className="size-4" /> Saved
    </span>
  );
}

function DetailsForm({ me }: { me: MeUser }) {
  const token = useAppStore((s) => s.token);
  const updateUser = useAppStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const professional = me.role === "landlord" || me.role === "agent" || me.role === "realtor";
  const copy = professional ? COPY[me.role as keyof typeof COPY] : null;

  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(me.whatsapp ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [experience, setExperience] = useState(me.experience ?? "");
  const [states, setStates] = useState<string[]>(me.states);
  const [areas, setAreas] = useState<string[]>(me.areasCovered);
  const [saved, setSaved] = useState(false);
  const areaOptions = useMemo(() => areasForStates(states), [states]);

  const save = useMutation({
    mutationFn: (patch: ProfilePatch) => updateMe(token!, patch),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["me"], user);
      updateUser({ name: user.name, email: user.email ?? "", phone: user.phone ?? "", bio: user.bio ?? "", states: user.states, areas: user.areasCovered });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate({
      name,
      email,
      phone,
      whatsapp,
      ...(professional && { bio, states, areasCovered: areas }),
      ...((me.role === "agent" || me.role === "realtor") && { experience }),
    });
  }

  return (
    <form onSubmit={submit}>
      {save.isError && <ErrorBanner message={save.error.message} />}
      <Section title="Contact details" description={professional ? "Shown on your public profile and listings." : "Used when you contact owners and agents."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Full name</Label>
            <FormInput variant="solid" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <FormInput variant="solid" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label>Phone{professional ? "" : " (optional)"}</Label>
            <FormInput variant="solid" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required={professional} autoComplete="tel" />
          </div>
          <div>
            <Label>WhatsApp (optional)</Label>
            <FormInput variant="solid" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
        </div>
      </Section>

      {copy && (
        <>
          <Section title="Where you work" description="Helps the right renters, buyers and requests find you.">
            <div className="flex flex-col gap-5">
              <div>
                <Label>{copy.states}</Label>
                <MultiSelectSearch
                  variant="solid"
                  options={LOCATIONS}
                  value={states}
                  onChange={(next) => {
                    setStates(next);
                    const valid = areasForStates(next);
                    setAreas((prev) => prev.filter((a) => valid.includes(a)));
                  }}
                  placeholder="Search states…"
                />
              </div>
              <div>
                <Label>{copy.areas}</Label>
                <MultiSelectSearch
                  variant="solid"
                  options={areaOptions}
                  value={areas}
                  onChange={setAreas}
                  disabled={states.length === 0}
                  disabledPlaceholder="Select a state first"
                  placeholder="Search areas…"
                />
              </div>
            </div>
          </Section>
          <Section title="About you" description="A short, honest introduction builds trust.">
            <div className="flex flex-col gap-4">
              <FormTextarea variant="solid" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={copy.bio} rows={4} maxLength={2000} />
              {(me.role === "agent" || me.role === "realtor") && (
                <div>
                  <Label>Experience</Label>
                  <FormInput variant="solid" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 6 years, residential lettings in Lekki" />
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      <div className="flex items-center justify-end gap-4 pb-8">
        <Saved show={saved} />
        <button type="submit" disabled={save.isPending} className={saveButton}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const token = useAppStore((s) => s.token);
  const role = useAppStore((s) => s.role);
  const logIn = useAppStore((s) => s.logIn);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => changePassword(token!, current, next),
    onSuccess: (res) => {
      // Other devices are now signed out; keep this one signed in with the new token.
      if (role && res.token) logIn(role, res.token);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => setError(err.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("Passwords don't match.");
    setError("");
    save.mutate();
  }

  return (
    <form onSubmit={submit}>
      <Section title="Password" description="Use at least 8 characters. Changing it signs you out on your other devices.">
        <div className="flex flex-col gap-4">
          <PasswordInput variant="solid" value={current} onChange={setCurrent} placeholder="Current password" autoComplete="current-password" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordInput variant="solid" value={next} onChange={setNext} placeholder="New password" autoComplete="new-password" required />
            <PasswordInput variant="solid" value={confirm} onChange={setConfirm} placeholder="Confirm new password" autoComplete="new-password" required />
          </div>
          {error && <div role="alert" className="text-sm text-destructive">{error}</div>}
          <div className="flex items-center justify-end gap-4">
            <Saved show={saved} />
            <button type="submit" disabled={save.isPending} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60">
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Update password
            </button>
          </div>
        </div>
      </Section>
    </form>
  );
}

function DangerZone() {
  const token = useAppStore((s) => s.token);
  const logOut = useAppStore((s) => s.logOut);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const deactivate = useMutation({
    mutationFn: () => deactivateAccount(token!, password),
    onSuccess: () => {
      logOut("Your account has been deactivated.");
      queryClient.clear();
      router.replace("/sign-in");
    },
  });

  return (
    <Section title="Deactivate account" description="Hides your profile and listings. Contact Housify to reactivate.">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
          Deactivate my account
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            deactivate.mutate();
          }}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <div className="mb-3 flex gap-2 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            Enter your password to confirm. You&apos;ll be signed out immediately.
          </div>
          <PasswordInput variant="solid" value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" required />
          {deactivate.isError && <div role="alert" className="mt-2 text-sm text-destructive">{deactivate.error.message}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={deactivate.isPending || !password} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-white disabled:opacity-50">
              {deactivate.isPending && <Loader2 className="size-4 animate-spin" />}
              Deactivate
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

export function ProfileSettings() {
  const { data: me, isLoading, isError, refetch } = useMe();
  const [formKey, setFormKey] = useState(0);
  // Re-seed the form if the profile is reloaded from the server.
  useEffect(() => setFormKey((k) => k + 1), [me?.id]);

  return (
    <div className="mx-auto max-w-[920px]">
      <PageHeader eyebrow="Account" title="Profile & settings" description="Everything here is saved to your Housify account." />
      {isError && <ErrorBanner message="We couldn't load your profile." onRetry={() => refetch()} />}

      {isLoading || !me ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="animate-in fade-in slide-in-from-bottom-2 mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft duration-500">
            <AvatarUploader me={me} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-semibold">{me.name}</div>
              <div className="text-sm text-muted-foreground">
                {ROLE_LABEL[me.role]} · joined {new Date(me.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </div>
            </div>
            {me.role !== "user" &&
              (me.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                  <Clock className="size-4" /> Verification pending
                </span>
              ))}
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border bg-card px-5 pt-8 shadow-soft duration-500 sm:px-8">
            <DetailsForm key={formKey} me={me} />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-4 rounded-2xl border border-border bg-card px-5 py-2 shadow-soft duration-500 sm:px-8">
            <PasswordForm />
            <DangerZone />
          </div>
        </>
      )}
    </div>
  );
}
