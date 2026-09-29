"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2, ShieldCheck, TimerOff } from "lucide-react";
import { checkResetToken, resetPassword } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const field =
  "h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 pr-12 text-[15px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-indigo-400/70 focus:bg-white/[0.09]";

const card = "w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10";

/** Rough guidance only — the server enforces the real minimum (8 characters). */
function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}
const STRENGTH = ["Too short", "Weak", "Okay", "Good", "Strong"];

type State = { step: "checking" } | { step: "invalid" } | { step: "form"; email: string | null } | { step: "done" };

export function ResetPasswordForm({ token }: { token: string }) {
  const logOut = useAppStore((s) => s.logOut);
  const [state, setState] = useState<State>(token ? { step: "checking" } : { step: "invalid" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Keep the one-time token out of browser history, bookmarks and screenshots.
    if (token) window.history.replaceState(null, "", "/reset-password");
    if (!token) return;
    checkResetToken(token)
      .then((r) => setState({ step: "form", email: r.email }))
      .catch(() => setState({ step: "invalid" }));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setError("");
    setSaving(true);
    try {
      await resetPassword(token, password);
      // Every session was signed out on the server; clear this browser's too.
      logOut();
      setState({ step: "done" });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "RESET_INVALID") setState({ step: "invalid" });
      else setError(err instanceof Error ? err.message : "Couldn't reset your password. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (state.step === "checking") {
    return (
      <div className={cn(card, "flex items-center justify-center gap-3 text-white/70")} role="status">
        <Loader2 className="size-5 animate-spin" /> Checking your link…
      </div>
    );
  }

  if (state.step === "invalid") {
    return (
      <div className={card}>
        <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-200">
          <TimerOff className="size-6" />
        </span>
        <h1 className="text-[26px] font-semibold">This link has expired</h1>
        <p className="mt-2 text-sm text-white/65">
          Reset links work once and only for 30 minutes. If you asked more than once, only the newest email&apos;s link works.
        </p>
        <Link
          href="/sign-in?forgot=1"
          className="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4f46e5] text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          Send a new link <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (state.step === "done") {
    return (
      <div className={card} role="status">
        <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-300">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="text-[26px] font-semibold">Password updated</h1>
        <p className="mt-2 text-sm text-white/65">
          You&apos;ve been signed out on every device. Sign in with your new password — we&apos;ve also emailed you a confirmation.
        </p>
        <Link href="/sign-in" className="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4f46e5] text-sm font-semibold text-white transition-all hover:brightness-110">
          Sign in <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const score = strength(password);
  return (
    <form onSubmit={submit} className={card} noValidate>
      <h1 className="text-[28px] font-semibold">Choose a new password</h1>
      <p className="mt-1.5 mb-8 text-sm text-white/60">{state.email ? <>For {state.email}</> : "For your Housify account"}</p>

      <div className="flex flex-col gap-4">
        <div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              aria-label="New password"
              autoComplete="new-password"
              autoFocus
              className={field}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide passwords" : "Show passwords"}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white/50 hover:text-white"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < score ? (score <= 1 ? "bg-red-400" : score === 2 ? "bg-amber-300" : "bg-emerald-400") : "bg-white/12"
                    )}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-xs text-white/60">{STRENGTH[score]}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            autoComplete="new-password"
            className={field}
          />
          {confirm && confirm === password && <Check className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-emerald-400" aria-label="Passwords match" />}
        </div>
        <p className="text-xs text-white/45">At least 8 characters. A longer phrase is stronger than a short, complex one.</p>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-[13px] text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#4f46e5] text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(79,70,229,0.8)] transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save new password"}
        </button>
      </div>
    </form>
  );
}
