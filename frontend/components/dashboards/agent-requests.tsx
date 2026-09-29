"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, Lock, MapPin, Users, Wallet, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getIncomingAgentRequests, updateAgentRequest, type AgentRequest, type AgentRequestStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { EmptyState, ErrorBanner, PageHeader, Panel, RowSkeleton, StatusPill } from "@/components/dashboards/ui";

export const REQUEST_STATUS: Record<AgentRequestStatus, { label: string; pill: string }> = {
  new: { label: "New", pill: "pending" },
  accepted: { label: "Accepted", pill: "active" },
  declined: { label: "Declined", pill: "removed" },
  closed: { label: "Closed", pill: "paused" },
};

export function useIncomingRequests() {
  const token = useAppStore((s) => s.token);
  return useQuery({ queryKey: ["agent-requests", "incoming"], queryFn: () => getIncomingAgentRequests(token!), enabled: !!token });
}

function RequestRow({ request }: { request: AgentRequest }) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const [note, setNote] = useState(request.agentNote ?? "");
  const update = useMutation({
    mutationFn: (patch: { status?: AgentRequestStatus; agentNote?: string }) => updateAgentRequest(token!, request.id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-requests", "incoming"] }),
  });
  const btn = "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <li className="px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={request.name} size={40} />
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{request.name}</span>
            <StatusPill status={REQUEST_STATUS[request.status].pill} label={REQUEST_STATUS[request.status].label} />
            {!request.assigned && <span className="rounded-md bg-highlight/10 px-1.5 py-0.5 text-[10px] font-semibold text-highlight uppercase">Open to agents</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {request.area}</span>
            {request.budget && <span className="inline-flex items-center gap-1"><Wallet className="size-3" /> {request.budget}</span>}
            <span>{formatDate(request.createdAt)}</span>
          </div>
          {request.lookingFor && <p className="mt-3 rounded-xl bg-secondary px-3.5 py-2.5 text-sm">{request.lookingFor}</p>}
          <div className="mt-3 text-sm">
            {request.contact ? (
              <span className="font-medium">{request.contact}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" /> Contact details are shared once you accept.
              </span>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-[240px]">
          <div className="flex flex-wrap gap-2">
            {request.status === "new" && (
              <>
                <button type="button" disabled={update.isPending} onClick={() => update.mutate({ status: "accepted" })} className={`${btn} bg-primary text-primary-foreground hover:brightness-110`}>
                  <Check className="size-3.5" /> Accept
                </button>
                {request.assigned && (
                  <button type="button" disabled={update.isPending} onClick={() => update.mutate({ status: "declined" })} className={`${btn} border border-border hover:text-destructive`}>
                    <X className="size-3.5" /> Decline
                  </button>
                )}
              </>
            )}
            {request.status === "accepted" && (
              <button type="button" disabled={update.isPending} onClick={() => update.mutate({ status: "closed" })} className={`${btn} border border-border hover:text-primary`}>
                Mark as closed
              </button>
            )}
          </div>
          {request.assigned && request.status !== "new" && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (request.agentNote ?? "") && update.mutate({ agentNote: note })}
              placeholder="Private note…"
              maxLength={1000}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
            />
          )}
          {update.isError && <span className="text-xs text-destructive">{update.error.message}</span>}
        </div>
      </div>
    </li>
  );
}

function RequestList({ items, empty }: { items: AgentRequest[]; empty: React.ReactNode }) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul className="divide-y divide-border">
      {items.map((r) => (
        <RequestRow key={r.id} request={r} />
      ))}
    </ul>
  );
}

export function AgentRequestsPage() {
  const { data, isLoading, isError, refetch } = useIncomingRequests();
  const [tab, setTab] = useState<"new" | "history">("new");
  const all = data ?? [];
  const items = all.filter((r) => (tab === "new" ? r.status === "new" : r.status === "declined" || r.status === "closed"));

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader eyebrow="Leads" title="Client requests" description="Requests sent to you directly, plus open requests in the areas you cover." />
      {isError && <ErrorBanner message="We couldn't load requests." onRetry={() => refetch()} />}
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        {(["new", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "new" ? "Needs a response" : "Closed & declined"}
          </button>
        ))}
      </div>
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : (
          <RequestList
            items={items}
            empty={
              <EmptyState
                icon={Inbox}
                title={tab === "new" ? "No requests waiting" : "Nothing here yet"}
                description={tab === "new" ? "Keep your coverage areas up to date so requests in those areas reach you." : "Requests you close or decline will be kept here."}
                actionLabel={tab === "new" ? "Update coverage" : undefined}
                actionHref={tab === "new" ? "/agent-dashboard/profile" : undefined}
              />
            }
          />
        )}
      </Panel>
    </div>
  );
}

export function AgentClientsPage() {
  const { data, isLoading, isError, refetch } = useIncomingRequests();
  const clients = (data ?? []).filter((r) => r.status === "accepted");
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader eyebrow="Relationships" title="Clients" description="People you've accepted and are actively helping." />
      {isError && <ErrorBanner message="We couldn't load your clients." onRetry={() => refetch()} />}
      <Panel bodyClassName="p-0 sm:p-0">
        {isLoading ? (
          <div className="p-6">
            <RowSkeleton />
          </div>
        ) : (
          <RequestList
            items={clients}
            empty={<EmptyState icon={Users} title="No active clients" description="Accept a client request and they'll be tracked here until you close it." actionLabel="View requests" actionHref="/agent-dashboard/requests" />}
          />
        )}
      </Panel>
    </div>
  );
}
