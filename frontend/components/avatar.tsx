import { User } from "lucide-react";

const PALETTE = [
  "bg-primary/15 text-primary",
  "bg-blue-500/15 text-blue-500",
  "bg-emerald-500/15 text-emerald-500",
  "bg-violet-500/15 text-violet-500",
  "bg-amber-500/15 text-amber-600",
  "bg-pink-500/15 text-pink-500",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsOf(name?: string | null): string {
  if (!name?.trim()) return "";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 40, className = "" }: AvatarProps) {
  const initials = initialsOf(name);
  const palette = PALETTE[name ? hashString(name) % PALETTE.length : 0];

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${palette} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || <User style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2} />}
    </div>
  );
}
