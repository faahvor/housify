"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { submitReport, type ReportCategory } from "@/lib/api";
import { cn } from "@/lib/utils";

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  complaint: "Complaint",
  query: "Question for Housify",
  suspicious_activity: "Suspicious activity",
  listing: "Report a listing",
  landlord: "Report a landlord",
  agent: "Report an agent",
  realtor: "Report a realtor",
  user: "Report a member",
};

const PERSON_CATEGORIES: ReportCategory[] = ["landlord", "agent", "realtor", "user"];

export interface ReportTargetOption {
  id: string;
  label: string;
  kind: "listing" | ReportCategory;
}

interface ReportFormProps {
  /** Listings and people the reporter has interacted with, for picking a target. */
  targets?: ReportTargetOption[];
  /** Preselect a category/target, e.g. from a listing page's "Report" button. */
  preset?: { category: ReportCategory; targetId?: string };
  onDone?: () => void;
}

const input =
  "w-full rounded-xl border border-border bg-secondary/50 px-3.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background";

export function ReportForm({ targets = [], preset, onDone }: ReportFormProps) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ReportCategory>(preset?.category ?? "complaint");
  const [targetId, setTargetId] = useState(preset?.targetId ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const needsListing = category === "listing";
  const needsPerson = PERSON_CATEGORIES.includes(category);
  const options = targets.filter((t) => (needsListing ? t.kind === "listing" : t.kind === category));

  const send = useMutation({
    mutationFn: () =>
      submitReport(token!, {
        category,
        subject,
        message,
        ...(needsListing && { targetListingId: targetId }),
        ...(needsPerson && { targetUserId: targetId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "mine"] });
    },
  });

  if (send.isSuccess) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="mb-3 size-10 text-success" />
        <div className="font-semibold">Sent to the Housify team</div>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">We&apos;ll review it and you&apos;ll get a notification when its status changes.</p>
        <button
          type="button"
          onClick={() => {
            send.reset();
            setSubject("");
            setMessage("");
            onDone?.();
          }}
          className="mt-5 cursor-pointer text-sm font-semibold text-primary hover:underline"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">What is this about?</span>
        <select
          className={cn(input, "h-11")}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as ReportCategory);
            setTargetId("");
          }}
        >
          {(Object.keys(REPORT_CATEGORY_LABEL) as ReportCategory[]).map((c) => (
            <option key={c} value={c}>
              {REPORT_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>

      {(needsListing || needsPerson) && (
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">{needsListing ? "Which listing?" : "Who?"}</span>
          {options.length > 0 ? (
            <select className={cn(input, "h-11")} value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
              <option value="">Choose…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl bg-secondary px-3.5 py-3 text-sm text-muted-foreground">
              {needsListing
                ? "You can report listings you've saved or asked about. You can also use the Report button on any listing page."
                : "You can report people you've dealt with through Housify, or use the Report button on their profile."}
            </p>
          )}
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">Subject</span>
        <input className={cn(input, "h-11")} value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={140} placeholder="A short summary" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">Details</span>
        <textarea
          className={cn(input, "min-h-[130px] py-3")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={4000}
          placeholder="What happened? Include dates, amounts and anything that helps us look into it."
        />
      </label>

      {send.isError && <div role="alert" className="text-sm text-destructive">{send.error.message}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={send.isPending || ((needsListing || needsPerson) && !targetId)}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {send.isPending && <Loader2 className="size-4 animate-spin" />}
          Send to Housify
        </button>
      </div>
    </form>
  );
}
