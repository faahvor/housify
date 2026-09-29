"use client";

import Link from "next/link";
import { Compass, Inbox, Map, Users } from "lucide-react";
import { formatDate } from "@/lib/format";
import { REQUEST_STATUS, useIncomingRequests } from "@/components/dashboards/agent-requests";
import { useAppStore } from "@/lib/store";
import { AccountStatusPanel, useMe } from "@/components/dashboards/account-status";
import { EmptyState, Metric, PageHeader, Panel, RowSkeleton, Skeleton, StatusPill, firstName, greeting } from "@/components/dashboards/ui";
import type { AgentRequest } from "@/lib/api";

function MiniList({ items }: { items: AgentRequest[] }) {
  return (
    <ul className="-my-2 divide-y divide-border">
      {items.slice(0, 4).map((r) => (
        <li key={r.id} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold">{r.name}</span>
            <StatusPill status={REQUEST_STATUS[r.status].pill} label={REQUEST_STATUS[r.status].label} />
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {r.area} · {formatDate(r.createdAt)}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AgentOverviewPage() {
  const { data: me, isLoading } = useMe();
  const requests = useIncomingRequests();
  const waiting = (requests.data ?? []).filter((r) => r.status === "new");
  const clients = (requests.data ?? []).filter((r) => r.status === "accepted");
  const storeName = useAppStore((s) => s.user?.name);
  const states = me?.states ?? [];
  const areas = me?.areasCovered ?? [];
  const name = firstName(me?.name ?? storeName);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow={today}
        title={name ? `${greeting()}, ${name}` : greeting()}
        description="Your coverage, incoming client requests and the people you're helping."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#4338ca] to-[#312e81] p-6 text-white shadow-glow duration-500 md:col-span-2 xl:row-span-2">
          <div className="bg-grid absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/75">Your coverage</span>
              <Compass className="size-5 text-white/60" />
            </div>

            {isLoading ? (
              <Skeleton className="mt-6 h-24 w-full bg-white/10" />
            ) : states.length === 0 && areas.length === 0 ? (
              <div className="mt-6">
                <p className="max-w-[320px] text-sm text-white/80">
                  Add the states and neighbourhoods you cover so clients looking in those areas can find you.
                </p>
                <Link
                  href="/agent-dashboard/profile"
                  className="mt-5 inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-sm font-semibold text-[#312e81] transition-transform hover:-translate-y-px"
                >
                  Set coverage areas
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  {states.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur">
                      <Map className="size-3.5" />
                      {s.replace(", Nigeria", "")}
                    </span>
                  ))}
                </div>
                {areas.length > 0 && (
                  <div className="mt-auto pt-8">
                    <div className="mb-2.5 text-xs text-white/70">Neighbourhoods</div>
                    <div className="flex flex-wrap gap-1.5">
                      {areas.slice(0, 12).map((a) => (
                        <span key={a} className="rounded-md bg-black/20 px-2 py-1 text-xs text-white/90">
                          {a}
                        </span>
                      ))}
                      {areas.length > 12 && <span className="px-1 py-1 text-xs text-white/70">+{areas.length - 12} more</span>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Metric label="Waiting for you" value={waiting.length} icon={Inbox} hint="Requests needing a response" loading={requests.isLoading} delay={60} />
        <Metric label="Active clients" value={clients.length} icon={Users} hint={`${areas.length} neighbourhoods · ${states.length} states covered`} loading={requests.isLoading} delay={120} />
        <AccountStatusPanel profileHref="/agent-dashboard/profile" className="md:col-span-2" delay={180} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Client requests" description="People asking for an agent in your areas" action={{ label: "Open", href: "/agent-dashboard/requests" }} delay={240}>
          {requests.isLoading ? (
            <RowSkeleton />
          ) : waiting.length === 0 ? (
            <EmptyState compact icon={Inbox} title="No requests waiting" description="Requests from renters and buyers in your coverage areas will appear here." />
          ) : (
            <MiniList items={waiting} />
          )}
        </Panel>
        <Panel title="Clients" description="People you're actively helping" action={{ label: "Open", href: "/agent-dashboard/clients" }} delay={300}>
          {requests.isLoading ? (
            <RowSkeleton />
          ) : clients.length === 0 ? (
            <EmptyState compact icon={Users} title="No clients yet" description="Accept a client request and the client will be tracked here." />
          ) : (
            <MiniList items={clients} />
          )}
        </Panel>
      </div>
    </div>
  );
}
