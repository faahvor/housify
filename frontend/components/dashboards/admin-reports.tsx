"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronDown, Flag, Inbox, Loader2, MessageSquare } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getAdminActivity, getAdminReports, updateReport, type Report, type ReportStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { REPORT_STATUS } from "@/components/dashboards/member";
import { REPORT_CATEGORY_LABEL } from "@/components/dashboards/report-form";
import { INQUIRY_STATUS } from "@/components/dashboards/inquiries-inbox";
import { REQUEST_STATUS } from "@/components/dashboards/agent-requests";
import { EmptyState, ErrorBanner, PageHeader, Panel, RowSkeleton, StatusPill } from "@/components/dashboards/ui";

function ReportRow({ report }: { report: Report }) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(report.status === "open");
  const [status, setStatus] = useState<ReportStatus>(report.status === "open" ? "under_review" : report.status);
  const [resolution, setResolution] = useState(report.resolution ?? "");
  const needsNote = status === "resolved" || status === "rejected";

  const save = useMutation({
    mutationFn: () => updateReport(token!, report.id, status, resolution.trim() || undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  const target = report.targetListing
    ? { label: report.targetListing.title ?? "Listing", href: null as string | null, meta: report.targetListing.status }
    : report.targetUser
      ? { label: report.targetUser.name ?? "Account", href: `/admin/people/${report.targetUser.id}`, meta: report.targetUser.status }
      : null;

  return (
    <li className="px-5 py-4 sm:px-6">
      <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="flex w-full cursor-pointer items-start gap-4 text-left">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Flag className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted-foreground">{REPORT_CATEGORY_LABEL[report.category]}</span>
          <span className="block truncate font-semibold">{report.subject}</span>
          <span className="block text-xs text-muted-foreground">
            From {report.reporter?.name ?? "—"} <span className="capitalize">({report.reporter?.role})</span> · {formatDate(report.createdAt)}
          </span>
        </span>
        <StatusPill status={REPORT_STATUS[report.status].pill} label={REPORT_STATUS[report.status].label} />
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="animate-in fade-in mt-4 grid gap-4 duration-200 md:grid-cols-[1fr_300px] md:pl-13">
          <div>
            <p className="rounded-xl bg-secondary px-4 py-3 text-sm whitespace-pre-wrap">{report.message}</p>
            {target && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">About: </span>
                {target.href ? (
                  <Link href={target.href} className="font-semibold text-primary hover:underline">
                    {target.label}
                  </Link>
                ) : (
                  <span className="font-semibold">{target.label}</span>
                )}
                {target.meta && <span className="ml-2 text-xs text-muted-foreground capitalize">({target.meta})</span>}
              </div>
            )}
            {report.reporter?.email && <div className="mt-1 text-xs text-muted-foreground">Reporter email: {report.reporter.email}</div>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="flex flex-col gap-2.5 rounded-xl border border-border p-3"
          >
            <label className="text-[13px] font-medium" htmlFor={`status-${report.id}`}>
              Status
            </label>
            <select
              id={`status-${report.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
              className="h-9 cursor-pointer rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
            >
              {(Object.keys(REPORT_STATUS) as ReportStatus[]).map((s) => (
                <option key={s} value={s}>
                  {REPORT_STATUS[s].label}
                </option>
              ))}
            </select>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              required={needsNote}
              maxLength={2000}
              placeholder={needsNote ? "Note to the reporter (required)" : "Note to the reporter (optional)"}
              className="min-h-[80px] rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
            />
            {save.isError && <span className="text-xs text-destructive">{save.error.message}</span>}
            <button
              type="submit"
              disabled={save.isPending || (needsNote && !resolution.trim())}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Update & notify reporter
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

const FILTERS: { key: ReportStatus | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "under_review", label: "Under review" },
  { key: "resolved", label: "Resolved" },
  { key: "rejected", label: "Closed" },
  { key: "all", label: "All" },
];

export function AdminReportsPage() {
  const token = useAppStore((s) => s.token);
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "reports", filter],
    queryFn: () => getAdminReports(token!, filter === "all" ? undefined : filter),
    enabled: !!token,
  });
  const reports = data ?? [];

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader eyebrow="Trust & safety" title="Reports & complaints" description="Everything people have reported or asked. Status changes notify the person who raised it." />
      {isError && <ErrorBanner message="We couldn't load reports." onRetry={() => refetch()} />}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-soft scrollbar-none sm:inline-flex">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState icon={Flag} title={filter === "open" ? "Nothing waiting" : "No reports here"} description={filter === "open" ? "New reports, complaints and queries will land here." : "Try another filter."} />
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((r) => (
              <ReportRow key={`${r.id}-${r.updatedAt}`} report={r} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export function AdminActivityPage() {
  const token = useAppStore((s) => s.token);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => getAdminActivity(token!),
    enabled: !!token,
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader eyebrow="Marketplace" title="Activity" description="The latest inquiries and agent requests across the platform." />
      {isError && <ErrorBanner message="We couldn't load activity." onRetry={() => refetch()} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Inquiries" description="Newest 25">
          {isLoading ? (
            <RowSkeleton />
          ) : (data?.inquiries ?? []).length === 0 ? (
            <EmptyState compact icon={MessageSquare} title="No inquiries yet" description="Inquiries on listings will appear here." />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {data!.inquiries.map((i) => (
                <li key={i.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm">
                      <span className="font-semibold">{i.from}</span> → {i.ownerName}
                    </span>
                    <StatusPill status={INQUIRY_STATUS[i.status].pill} label={INQUIRY_STATUS[i.status].label} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {i.listingTitle} · {formatDate(i.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Agent requests" description="Newest 25">
          {isLoading ? (
            <RowSkeleton />
          ) : (data?.agentRequests ?? []).length === 0 ? (
            <EmptyState compact icon={Inbox} title="No agent requests yet" description="Requests for agents will appear here." />
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {data!.agentRequests.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm">
                      <span className="font-semibold">{r.from}</span> · {r.area}
                    </span>
                    <StatusPill status={REQUEST_STATUS[r.status].pill} label={REQUEST_STATUS[r.status].label} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.agentName ? `Agent: ${r.agentName}` : "Open to agents"} · {formatDate(r.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Activity className="size-3.5" /> Contact details aren&apos;t shown here; open the relevant account if you need to follow up.
      </p>
    </div>
  );
}
