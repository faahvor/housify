"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { FormInput } from "@/components/form-input";
import { PasswordInput } from "@/components/password-input";
import { Avatar } from "@/components/avatar";
import { useAppStore } from "@/lib/store";
import { getMe, updateMe, changePassword } from "@/lib/api";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 border-b border-border pb-3.5 font-display text-[16px] font-semibold tracking-[-0.015em]">{children}</div>;
}

export default function AdminProfilePage() {
  const token = useAppStore((s) => s.token);
  const setUser = useAppStore((s) => s.setUser);
  const logIn = useAppStore((s) => s.logIn);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(({ user: me }) => {
        setName(me.name ?? "");
        setUsername(me.username ?? "");
      })
      .catch(() => setError("Couldn't load your profile."))
      .finally(() => setLoading(false));
  }, [token]);

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      const { user: me } = await updateMe(token, { name, username });
      setUser({ name: me.name, email: "", phone: "", bio: "", states: [], areas: [] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordError("");
    setPasswordSaving(true);
    try {
      const res = await changePassword(token, currentPassword, newPassword);
      // Other sessions are signed out; this one continues with the new token.
      if (res.token) logIn("admin", res.token);
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="animate-in fade-in slide-in-from-bottom-3 mb-9 flex items-center gap-4 duration-500">
        <Avatar name={name} size={56} />
        <div>
          <div className="mb-1.5 text-xs font-medium text-primary">Account</div>
          <h1 className="text-[26px] font-semibold sm:text-[32px]">Profile</h1>
        </div>
      </div>

      <form
        onSubmit={submitDetails}
        className="animate-in fade-in slide-in-from-bottom-3 mb-8 rounded-2xl border border-border bg-card p-6 shadow-soft duration-500 sm:p-8"
      >
        <SectionTitle>Account Details</SectionTitle>
        <div className="flex flex-col gap-4">
          <FormInput
            variant="solid"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            disabled={loading}
          />
          <FormInput
            variant="solid"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            disabled={loading}
          />
        </div>
        {error && <div className="mt-4 text-xs text-primary">{error}</div>}
        <div className="mt-8 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || saving}
            className="cursor-pointer rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px hover:brightness-110 active:translate-y-0 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && (
            <span className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1.5 text-[13px] font-medium text-primary duration-300">
              <Check className="size-4" strokeWidth={2.5} />
              Saved
            </span>
          )}
        </div>
      </form>

      <form
        onSubmit={submitPassword}
        className="animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-border bg-card p-6 shadow-soft duration-500 sm:p-8"
        style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
      >
        <SectionTitle>Change Password</SectionTitle>
        <div className="flex flex-col gap-4">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <div className="flex flex-wrap gap-4">
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="New password"
              autoComplete="new-password"
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>
          {passwordError && <div className="text-xs text-primary">{passwordError}</div>}
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="submit"
            disabled={passwordSaving}
            className="cursor-pointer rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
          >
            {passwordSaving ? "Updating…" : "Update Password"}
          </button>
          {passwordSaved && (
            <span className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1.5 text-[13px] font-medium text-primary duration-300">
              <Check className="size-4" strokeWidth={2.5} />
              Updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
