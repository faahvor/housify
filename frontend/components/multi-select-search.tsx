"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

interface MultiSelectSearchProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabledPlaceholder?: string;
  disabled?: boolean;
  variant?: "dark" | "light" | "solid";
}

export function MultiSelectSearch({
  options,
  value,
  onChange,
  placeholder = "Search…",
  disabledPlaceholder = "Select a city first",
  disabled = false,
  variant = "dark",
}: MultiSelectSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return options.filter((o) => !value.includes(o)).slice(0, 40);
    const lower = query.toLowerCase();
    return options.filter((o) => !value.includes(o) && o.toLowerCase().includes(lower)).slice(0, 40);
  }, [options, value, query]);

  function add(option: string) {
    onChange([...value, option]);
    setQuery("");
  }

  function remove(option: string) {
    onChange(value.filter((v) => v !== option));
  }

  const isDark = variant === "dark";
  const isSolid = variant === "solid";

  const border = isSolid ? "border-border" : isDark ? "border-cream/35" : "border-ink";
  const text = isSolid ? "text-foreground" : isDark ? "text-cream" : "text-ink";
  const chipBg = isSolid ? "bg-primary/10 text-primary" : isDark ? "bg-cream/10" : "bg-ink/8";

  const inputClass = isSolid
    ? "w-full rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-[15px] text-foreground outline-none placeholder:opacity-60 transition-colors focus:border-primary focus:bg-background disabled:cursor-not-allowed disabled:opacity-40"
    : `w-full border-0 border-b bg-transparent px-4 py-4 text-[15px] outline-none placeholder:opacity-60 disabled:cursor-not-allowed disabled:opacity-40 ${border} ${text}`;

  return (
    <div className="relative">
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((v) => (
            <span
              key={v}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${chipBg} ${isSolid ? "" : text}`}
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className={`cursor-pointer hover:opacity-70 ${isSolid ? "text-primary" : "text-gold"}`}
                aria-label={`Remove ${v}`}
              >
                <X className="size-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        disabled={disabled}
        placeholder={disabled ? disabledPlaceholder : placeholder}
        className={inputClass}
      />

      {open && !disabled && filtered.length > 0 && (
        <div
          className={`absolute z-20 mt-1 max-h-56 w-full overflow-y-auto ${
            isSolid
              ? "rounded-xl border border-border bg-popover shadow-lg"
              : `border ${border} ${isDark ? "bg-ink" : "bg-cream"}`
          }`}
        >
          {filtered.map((o) => (
            <button
              type="button"
              key={o}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(o)}
              className={`block w-full cursor-pointer px-4 py-2.5 text-left text-sm ${
                isSolid ? "text-foreground hover:bg-primary/10 hover:text-primary" : `hover:bg-gold hover:text-ink ${text}`
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
