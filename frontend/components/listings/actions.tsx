"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@base-ui/react/dialog";
import { Check, Flag, Heart, Link2, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getFavoriteIds, saveListing, unsaveListing, type ReportCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTE } from "@/lib/roles";
import { ReportForm } from "@/components/dashboards/report-form";

function useSignInRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  return () => router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
}

export function useFavoriteIds() {
  const token = useAppStore((s) => s.token);
  const role = useAppStore((s) => s.role);
  return useQuery({
    queryKey: ["favorite-ids"],
    queryFn: () => getFavoriteIds(token!),
    enabled: !!token && role !== "admin",
    staleTime: 60_000,
  });
}

const actionBtn =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold transition-colors hover:border-primary/40 disabled:opacity-60";

export function SaveButton({ listingId, compact = false }: { listingId: string; compact?: boolean }) {
  const token = useAppStore((s) => s.token);
  const role = useAppStore((s) => s.role);
  const queryClient = useQueryClient();
  const signIn = useSignInRedirect();
  const { data: ids = [] } = useFavoriteIds();
  const saved = ids.includes(listingId);

  const toggle = useMutation({
    mutationFn: () => (saved ? unsaveListing(token!, listingId) : saveListing(token!, listingId)),
    onMutate: () => {
      // Optimistic: flip the heart immediately.
      queryClient.setQueryData<string[]>(["favorite-ids"], (prev = []) => (saved ? prev.filter((i) => i !== listingId) : [...prev, listingId]));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  if (role === "admin") return null;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved homes" : "Save this home"}
      disabled={toggle.isPending}
      onClick={() => (token ? toggle.mutate() : signIn())}
      className={cn(actionBtn, saved && "border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-400", compact && "px-3")}
    >
      <Heart className={cn("size-4 transition-transform", saved && "scale-110 fill-current")} />
      {!compact && (saved ? "Saved" : "Save")}
    </button>
  );
}

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch {
          /* share sheet dismissed */
        }
      }}
      className={actionBtn}
    >
      {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function ReportButton({
  category,
  targetId,
  targetLabel,
  label = "Report",
}: {
  category: ReportCategory;
  targetId: string;
  targetLabel: string;
  label?: string;
}) {
  const token = useAppStore((s) => s.token);
  const role = useAppStore((s) => s.role);
  const signIn = useSignInRedirect();
  const [open, setOpen] = useState(false);
  if (role === "admin") return null;

  return (
    <>
      <button type="button" onClick={() => (token ? setOpen(true) : signIn())} className={cn(actionBtn, "text-muted-foreground hover:text-destructive")}>
        <Flag className="size-4" />
        {label}
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-[70] max-h-[90vh] w-[calc(100vw-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl transition-all data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="font-display text-lg font-semibold">Report to Housify</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">About: {targetLabel}. Our team reviews every report.</Dialog.Description>
              </div>
              <Dialog.Close aria-label="Close" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-secondary">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <ReportForm
              targets={[{ id: targetId, label: targetLabel, kind: category === "listing" ? "listing" : category }]}
              preset={{ category, targetId }}
              onDone={() => setOpen(false)}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              You can follow this report from{" "}
              <Link href={`${DASHBOARD_ROUTE[role ?? "user"]}/support`} className="font-medium text-primary hover:underline">
                your dashboard
              </Link>
              .
            </p>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
