import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

// Rounded indigo tile with a roofline "H" — reads as both a house and the initial.
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#4338ca] shadow-[0_6px_16px_-6px_rgba(79,70,229,0.7)]",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none">
        <path
          d="M4 11.2 12 4.5l8 6.7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7.5 19.5v-7M16.5 19.5v-7M7.5 15.5h9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
    </span>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Hide the wordmark, e.g. in a collapsed rail. */
  compact?: boolean;
  /** "light" for use over photos and dark panels. */
  tone?: "default" | "light";
}

export function Logo({ className, markClassName, compact = false, tone = "default" }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {!compact && (
        <span className={cn("font-display text-[19px] font-semibold tracking-[-0.03em] transition-colors", tone === "light" ? "text-white" : "text-foreground")}>
          Housify
        </span>
      )}
    </span>
  );
}
