"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { login } from "@/lib/api";
import { DASHBOARD_ROUTE } from "@/lib/roles";

const field =
  "h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-[15px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-indigo-400/70 focus:bg-white/[0.09]";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const logIn = useAppStore((s) => s.logIn);
  const setUser = useAppStore((s) => s.setUser);
  const sessionNotice = useAppStore((s) => s.sessionNotice);
  const clearSessionNotice = useAppStore((s) => s.clearSessionNotice);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Show "session expired"/"account suspended" once, then forget it.
  useEffect(() => {
    if (sessionNotice) {
      setNotice(sessionNotice);
      clearSessionNotice();
    }
  }, [sessionNotice, clearSessionNotice]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("");
    setNotice(null);
    setSubmitting(true);
    try {
      const { token, user } = await login(identifier.trim(), password);
      queryClient.clear();
      logIn(user.role, token);
      setUser({ name: user.name, email: user.email ?? "", phone: user.phone ?? "", bio: user.bio ?? "", states: user.states, areas: user.areasCovered });
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : DASHBOARD_ROUTE[user.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10">
      <h1 className="text-[28px] font-semibold text-white">Welcome back</h1>
      <p className="mt-1.5 mb-8 text-sm text-white/60">Sign in to your Housify account.</p>

      {notice && (
        <div role="status" className="mb-5 flex gap-2.5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3.5 py-3 text-[13px] text-amber-100">
          <Info className="mt-0.5 size-4 shrink-0" />
          {notice}
        </div>
      )}

      {showForgot ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/75">
          <div className="mb-2 font-semibold text-white">Forgot your password?</div>
          <p>
            Email-based password reset isn&apos;t available yet. If you can&apos;t sign in, contact the Housify team from the
            email address on your account and we&apos;ll help you regain access.
          </p>
          <button
            type="button"
            onClick={() => setShowForgot(false)}
            className="mt-4 cursor-pointer text-[13px] font-semibold text-indigo-300 hover:text-indigo-200"
          >
            ← Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email (or admin username)"
            autoComplete="username"
            aria-label="Email or username"
            className={field}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              aria-label="Password"
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white/50 hover:text-white"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && (
            <div role="alert" className="flex items-start gap-2 text-[13px] text-red-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}
          <button type="button" onClick={() => setShowForgot(true)} className="-mt-1 cursor-pointer self-end text-xs text-white/55 hover:text-white/80">
            Forgot password?
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#4f46e5] text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(79,70,229,0.8)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Signing in…" : "Sign in"}
            {!submitting && <ArrowRight className="size-4" />}
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-white/10 pt-6 text-center text-[13px] text-white/60">
        New to Housify?{" "}
        <Link href="/join" className="font-semibold text-indigo-300 hover:text-indigo-200">
          Create an account
        </Link>
      </div>
    </div>
  );
}
