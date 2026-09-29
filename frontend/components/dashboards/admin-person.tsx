"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, BadgeX, Ban, Building2, Mail, MapPin, MessageCircle, Phone, RotateCcw, ShieldAlert, UserX } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getAdminPerson, setAccountStatus, setVerification, type AccountStatus } from "@/lib/api";
import { formatDate, formatListingPrice } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import { Avatar } from "@/components/avatar";
import { ListingThumb } from "@/components/dashboards/listing-thumb";
import { ConfirmDialog } from "@/components/dashboards/confirm-dialog";
import { AccountStatusPill } from "@/components/dashboards/admin-directory";
import { REPORT_STATUS } from "@/components/dashboards/member";
import { REPORT_CATEGORY_LABEL } from "@/components/dashboards/report-form";
import { EmptyState, ErrorBanner, Panel, RowSkeleton, StatusPill } from "@/components/dashboards/ui";

type Action = { kind: "status"; status: AccountStatus } | { kind: "verify"; verified: boolean };

const ACTION_COPY: Record<string, { title: string; description: string; confirm: string; tone: "danger" | "primary"; reason?: { label: string; required: boolean; placeholder?: string } }> = {
  suspended: {
    title: "Suspend this account?",
    description: "They'll be signed out everywhere and their listings hidden. They see your reason when they try to sign in.",
    confirm: "Suspend",
    tone: "danger",
    reason: { label: "Reason (shown to them)", required: true, placeholder: "e.g. Multiple reports of requesting inspection fees." },
  },
  deactivated: {
    title: "Deactivate this account?",
    description: "Closes the account and hides everything it owns.",
    confirm: "Deactivate",
    tone: "danger",
    reason: { label: "Reason", required: true },
  },
  active: {
    title: "Reactivate this account?",
    description: "They'll regain full access and their listings will show again.",
    confirm: "Reactivate",
    tone: "primary",
    reason: { label: "Message to them (optional)", required: false },
  },
  verify: { title: "Verify this professional?", description: "Adds the Housify verified badge to their profile and listings.", confirm: "Verify", tone: "primary" },
  unverify: { title: "Remove verification?", description: "Removes the verified badge. They'll be notified.", confirm: "Remove badge", tone: "danger" },
};

export function AdminPersonPage({ id }: { id: string }) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "person", id],
    queryFn: () => getAdminPerson(token!, id),
    enabled: !!token,
  });

  const act = useMutation({
    mutationFn: ({ action, reason }: { action: Action; reason: string }) =>
      action.kind === "status" ? setAccountStatus(token!, id, action.status, reason || undefined) : setVerification(token!, id, action.verified),
    onSuccess: () => {
      setAction(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const copyKey = !action ? null : action.kind === "status" ? action.status : action.verified ? "verify" : "unverify";
  const copy = copyKey ? ACTION_COPY[copyKey] : null;

  if (isLoading) {
    return (
      <Panel className="mx-auto max-w-[1100px]">
        <RowSkeleton rows={5} />
      </Panel>
    );
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <ErrorBanner message="We couldn't load this account." onRetry={() => refetch()} />
      </div>
    );
  }

  const { person, listings, reportsAgainst, counts } = data;
  const professional = person.role !== "user";
  const btn = "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link href={`/admin/people?role=${person.role}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> People
      </Link>

      <section className="animate-in fade-in slide-in-from-bottom-2 mb-4 rounded-2xl border border-border bg-card p-6 shadow-soft duration-500">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={person.name} src={person.avatarUrl} size={64} />
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{person.name}</h1>
              <AccountStatusPill person={person} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {ROLE_LABEL[person.role]} · joined {formatDate(person.createdAt)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
              {person.email && (
                <a href={`mailto:${person.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="size-3.5" /> {person.email}
                </a>
              )}
              {person.phone && (
                <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Phone className="size-3.5" /> {person.phone}
                </a>
              )}
              {person.whatsapp && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MessageCircle className="size-3.5" /> {person.whatsapp}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {professional &&
              person.status === "active" &&
              (person.verified ? (
                <button type="button" onClick={() => setAction({ kind: "verify", verified: false })} className={`${btn} hover:text-destructive`}>
                  <BadgeX className="size-4" /> Remove badge
                </button>
              ) : (
                <button type="button" onClick={() => setAction({ kind: "verify", verified: true })} className={`${btn} border-primary/40 bg-primary text-primary-foreground`}>
                  <BadgeCheck className="size-4" /> Verify
                </button>
              ))}
            {person.status === "active" ? (
              <>
                <button type="button" onClick={() => setAction({ kind: "status", status: "suspended" })} className={`${btn} text-destructive hover:bg-destructive/10`}>
                  <Ban className="size-4" /> Suspend
                </button>
                <button type="button" onClick={() => setAction({ kind: "status", status: "deactivated" })} className={`${btn} text-muted-foreground hover:text-destructive`}>
                  <UserX className="size-4" /> Deactivate
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setAction({ kind: "status", status: "active" })} className={`${btn} hover:text-primary`}>
                <RotateCcw className="size-4" /> Reactivate
              </button>
            )}
          </div>
        </div>
        {person.status !== "active" && person.statusReason && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold capitalize">{person.status}</span>
              {person.statusChangedAt && ` on ${formatDate(person.statusChangedAt)}`}: {person.statusReason}
            </span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="At a glance" delay={60}>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Listings", value: listings.length },
              { label: "Reports against", value: reportsAgainst.length },
              { label: "Inquiries received", value: counts.inquiriesReceived },
              { label: "Inquiries sent", value: counts.inquiriesSent },
              { label: "Reports filed", value: counts.reportsFiled },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="font-display text-xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          {professional && (person.bio || person.areasCovered.length > 0) && (
            <div className="mt-5 border-t border-border pt-4 text-sm">
              {person.bio && <p className="text-muted-foreground">{person.bio}</p>}
              {person.areasCovered.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {person.areasCovered.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
                      <MapPin className="size-3" /> {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Reports against this account" className="lg:col-span-2" action={reportsAgainst.length ? { label: "All reports", href: "/admin/reports" } : undefined} delay={120}>
          {reportsAgainst.length === 0 ? (
            <EmptyState compact icon={ShieldAlert} title="No reports" description="Nobody has reported this account." />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {reportsAgainst.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">{r.subject}</span>
                    <StatusPill status={REPORT_STATUS[r.status].pill} label={REPORT_STATUS[r.status].label} />
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {REPORT_CATEGORY_LABEL[r.category]} · by {r.reporter?.name ?? "—"} · {formatDate(r.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {professional && (
          <Panel title="Listings" className="lg:col-span-3" delay={180}>
            {listings.length === 0 ? (
              <EmptyState compact icon={Building2} title="No listings" description="This account hasn't listed anything." />
            ) : (
              <ul className="-my-2 divide-y divide-border">
                {listings.map((l) => (
                  <li key={l.id} className="flex items-center gap-4 py-3">
                    <ListingThumb src={l.photos[0]} alt={l.title} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{l.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {l.location} · {formatListingPrice(l)}
                      </div>
                    </div>
                    <StatusPill status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>

      {copy && action && (
        <ConfirmDialog
          open
          onOpenChange={(o) => {
            if (!o) {
              setAction(null);
              act.reset();
            }
          }}
          title={copy.title}
          description={copy.description}
          confirmLabel={copy.confirm}
          tone={copy.tone}
          reason={copy.reason}
          pending={act.isPending}
          error={act.error?.message}
          onConfirm={(reason) => act.mutate({ action, reason })}
        />
      )}
    </div>
  );
}
