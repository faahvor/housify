"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  /** Ask for a reason/note, e.g. why an account was suspended. */
  reason?: { label: string; placeholder?: string; required?: boolean };
  pending?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, tone = "primary", reason, pending, error, onConfirm }: ConfirmDialogProps) {
  const [text, setText] = useState("");
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setText("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl transition-all duration-200 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
          <Dialog.Title className="font-display text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">{description}</Dialog.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm(text.trim());
            }}
          >
            {reason && (
              <label className="mt-5 block">
                <span className="mb-1.5 block text-[13px] font-medium">{reason.label}</span>
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required={reason.required}
                  maxLength={2000}
                  placeholder={reason.placeholder}
                  className="min-h-[96px] w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-3 text-sm outline-none focus:border-primary focus:bg-background"
                />
              </label>
            )}
            {error && <div role="alert" className="mt-3 text-sm text-destructive">{error}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className="h-10 cursor-pointer rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</Dialog.Close>
              <button
                type="submit"
                disabled={pending || (reason?.required && !text.trim())}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50",
                  tone === "danger" ? "bg-destructive text-white" : "bg-primary text-primary-foreground"
                )}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
