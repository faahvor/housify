"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, RotateCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/use-count-up";

/* ───────────── Page header ───────────── */

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 duration-500",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs font-medium text-primary">{eyebrow}</div>}
        <h1 className="text-[26px] leading-tight font-semibold sm:text-[32px]">{title}</h1>
        {description && <p className="mt-2 max-w-[560px] text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────────── Buttons (links styled as buttons) ───────────── */

export function PrimaryLink({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px hover:brightness-110 active:translate-y-0"
    >
      {Icon && <Icon className="size-4" strokeWidth={2.4} />}
      {children}
    </Link>
  );
}

/* ───────────── Panel (bento cell) ───────────── */

interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: { label: string; href: string };
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  delay?: number;
}

export function Panel({ title, description, action, className, bodyClassName, children, delay = 0 }: PanelProps) {
  return (
    <section
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 flex flex-col rounded-2xl border border-border bg-card shadow-soft duration-500",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.015em]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action && (
            <Link
              href={action.href}
              className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {action.label}
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
        </div>
      )}
      <div className={cn("flex-1 p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ───────────── Metric tile ───────────── */

interface MetricProps {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: React.ReactNode;
  loading?: boolean;
  delay?: number;
  className?: string;
}

export function Metric({ label, value, icon: Icon, hint, loading, delay = 0, className }: MetricProps) {
  const animated = useCountUp(loading ? 0 : value);
  return (
    <div
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors duration-500 hover:border-primary/25",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <Icon className="size-4" strokeWidth={2} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-16" />
      ) : (
        <div className="mt-3 font-display text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{animated}</div>
      )}
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* ───────────── Distribution bar ───────────── */

interface Segment {
  label: string;
  value: number;
  colorClass: string;
}

/** A single stacked bar with a legend — for honest, at-a-glance proportions. */
export function DistributionBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div>
      <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-secondary" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                className={cn("h-full rounded-full transition-[width] duration-700", s.colorClass)}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className={cn("size-2 rounded-full", s.colorClass)} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Status pill ───────────── */

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  verified: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  pending: "bg-highlight/10 text-highlight",
  removed: "bg-destructive/10 text-destructive",
  suspended: "bg-destructive/10 text-destructive",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
        STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? status}
    </span>
  );
}

/* ───────────── Empty / error / loading ───────────── */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-8" : "py-14", className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
        <div className="relative flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/15 to-primary/5 text-primary">
          <Icon className="size-5" strokeWidth={1.9} />
        </div>
      </div>
      <div className="text-[15px] font-semibold">{title}</div>
      <p className="mt-1.5 max-w-[340px] text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-5">
          <PrimaryLink href={actionHref}>{actionLabel}</PrimaryLink>
        </div>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm">
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <RotateCw className="size-3" />
          Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-secondary", className)} />;
}

export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ───────────── Helpers ───────────── */

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? "";
}
