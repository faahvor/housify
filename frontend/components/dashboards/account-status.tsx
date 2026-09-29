"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Check, Clock, UserRound } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getMe, type MeUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Panel, Skeleton } from "@/components/dashboards/ui";

export function useMe() {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token!).then((r) => r.user),
    enabled: !!token,
  });
}

function checklist(me: MeUser) {
  return [
    { label: "Full name", done: !!me.name?.trim() },
    { label: "Phone number", done: !!me.phone?.trim() },
    { label: "Short bio", done: !!me.bio?.trim() },
    { label: "Areas you work in", done: (me.states?.length ?? 0) > 0 || (me.areasCovered?.length ?? 0) > 0 },
  ];
}

/** Verification + profile completeness, computed from the live /auth/me record. */
export function AccountStatusPanel({ profileHref, className, delay }: { profileHref: string; className?: string; delay?: number }) {
  const { data: me, isLoading } = useMe();
  const items = me ? checklist(me) : [];
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <Panel title="Account" description="Trust signals renters see" action={{ label: "Edit profile", href: profileHref }} className={className} delay={delay}>
      {isLoading || !me ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm",
              me.verified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            )}
          >
            {me.verified ? <BadgeCheck className="size-5 shrink-0" /> : <Clock className="size-5 shrink-0" />}
            <div>
              <div className="font-semibold">{me.verified ? "Verified account" : "Verification pending"}</div>
              <div className="text-xs opacity-80">
                {me.verified ? "Your profile shows a verified badge." : "Our team reviews new accounts before adding the badge."}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium">Profile completeness</span>
              <span className="font-semibold tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-highlight transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[13px]">
                  <span
                    className={cn(
                      "flex size-4.5 items-center justify-center rounded-full",
                      item.done ? "bg-primary text-primary-foreground" : "border border-border text-transparent"
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className={item.done ? "text-muted-foreground line-through decoration-border" : ""}>{item.label}</span>
                </li>
              ))}
            </ul>
            {pct < 100 && (
              <Link href={profileHref} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <UserRound className="size-3.5" />
                Complete your profile
              </Link>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
