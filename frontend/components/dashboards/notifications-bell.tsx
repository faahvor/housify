"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover } from "@base-ui/react/popover";
import { io } from "socket.io-client";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { API_URL, getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from "@/lib/api";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NotificationsBell() {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(token!),
    enabled: !!token,
    refetchInterval: 120_000,
  });

  // Live updates: the API pushes each new notification to this user's private room.
  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { auth: { token }, transports: ["websocket"] });
    socket.on("notification", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Whatever the notification is about may have changed too.
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "notifications" && q.queryKey[0] !== "me" });
    });
    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  function open(n: AppNotification) {
    if (!n.read) readOne.mutate(n.id);
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none data-[popup-open]:bg-secondary data-[popup-open]:text-foreground"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="flex max-h-[min(520px,75vh)] w-[min(380px,calc(100vw-1.5rem))] origin-[var(--transform-origin)] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Popover.Title className="text-sm font-semibold">Notifications</Popover.Title>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => readAll.mutate()}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <BellOff className="mb-3 size-6 text-muted-foreground" />
                <div className="text-sm font-medium">You&apos;re all caught up</div>
                <p className="mt-1 text-xs text-muted-foreground">Inquiries, requests and account updates will show up here.</p>
              </div>
            ) : (
              <ul className="overflow-y-auto p-1.5">
                {items.map((n) => {
                  const content = (
                    <>
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm", !n.read && "font-semibold")}>{n.title}</span>
                        {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
                        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </span>
                    </>
                  );
                  const cls = "flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary";
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Popover.Close render={<Link href={n.link} onClick={() => open(n)} className={cls} />}>{content}</Popover.Close>
                      ) : (
                        <button type="button" onClick={() => open(n)} className={cn(cls, "cursor-pointer")}>
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
