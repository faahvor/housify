"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { CornerDownLeft, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  /** Navigate to a route… */
  href?: string;
  /** …or run an action. */
  run?: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
}

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.label} ${item.group} ${item.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => setCursor(0), [query, open]);
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function select(item: CommandItem) {
    onOpenChange(false);
    if (item.href) router.push(item.href);
    else item.run?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && filtered[cursor]) {
      e.preventDefault();
      select(filtered[cursor]);
    }
  }

  const groups = [...new Set(filtered.map((i) => i.group))];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-200 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0"
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">Search or jump to</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages and actions…"
              aria-label="Search pages and actions"
              role="combobox"
              aria-expanded
              aria-controls="command-list"
              aria-activedescendant={filtered[cursor] ? `cmd-${filtered[cursor].id}` : undefined}
              className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded-md border border-border px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
              Esc
            </kbd>
          </div>

          <div ref={listRef} id="command-list" role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="px-3 py-10 text-center text-sm text-muted-foreground">No results for “{query}”.</div>
            )}
            {groups.map((group) => (
              <div key={group} className="mb-1 last:mb-0">
                <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {group}
                </div>
                {filtered
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const index = filtered.indexOf(item);
                    const active = index === cursor;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        id={`cmd-${item.id}`}
                        role="option"
                        aria-selected={active}
                        data-index={index}
                        onMouseMove={() => setCursor(index)}
                        onClick={() => select(item)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active ? "bg-primary/10 text-foreground" : "text-foreground/80"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-lg border border-border transition-colors",
                            active ? "border-primary/30 bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="flex-1 truncate font-medium">{item.label}</span>
                        {active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
