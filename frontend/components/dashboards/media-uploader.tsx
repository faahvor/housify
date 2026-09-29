"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, RotateCw, Star, Upload, Video, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { uploadFile, type UploadKind } from "@/lib/api";
import { cn } from "@/lib/utils";

type MediaKind = Extract<UploadKind, "listing-photo" | "listing-video">;

const CONFIG: Record<MediaKind, { accept: string; maxBytes: number; types: RegExp; label: string }> = {
  "listing-photo": { accept: "image/jpeg,image/png,image/webp,image/heic,image/heif", maxBytes: 15 * 1024 * 1024, types: /^image\//, label: "photos" },
  "listing-video": { accept: "video/mp4,video/quicktime,video/webm", maxBytes: 60 * 1024 * 1024, types: /^video\//, label: "videos" },
};
const CONCURRENCY = 3;

interface Pending {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
  controller: AbortController;
}

interface MediaUploaderProps {
  kind: MediaKind;
  values: string[];
  /** Receives an updater so concurrent uploads never overwrite each other. */
  onChange: (update: (prev: string[]) => string[]) => void;
  max: number;
  disabled?: boolean;
  /** Called with true while files are still uploading. */
  onBusyChange?: (busy: boolean) => void;
}

const iconBtn =
  "flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40";

export function MediaUploader({ kind, values, onChange, max, disabled, onBusyChange }: MediaUploaderProps) {
  const token = useAppStore((s) => s.token);
  const cfg = CONFIG[kind];
  const isPhoto = kind === "listing-photo";
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const active = useRef(0);
  const queue = useRef<Pending[]>([]);

  // Free object URLs when previews go away.
  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = pending.some((p) => !p.error);
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  const patch = (id: string, change: Partial<Pending>) => setPending((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)));

  function pump() {
    while (active.current < CONCURRENCY && queue.current.length > 0) {
      const item = queue.current.shift()!;
      active.current++;
      uploadFile(token!, kind, item.file, { onProgress: (f) => patch(item.id, { progress: f }), signal: item.controller.signal })
        .then((up) => {
          onChange((prev) => (prev.includes(up.url) ? prev : [...prev, up.url]));
          URL.revokeObjectURL(item.preview);
          setPending((list) => list.filter((p) => p.id !== item.id));
        })
        .catch((err: Error & { code?: string }) => {
          if (err.code === "ABORTED") return;
          patch(item.id, { error: err.message, progress: 0 });
        })
        .finally(() => {
          active.current--;
          pump();
        });
    }
  }

  function addFiles(files: FileList | File[]) {
    setNotice("");
    const room = max - values.length - pending.length;
    const list = Array.from(files);
    if (room <= 0) return setNotice(`You can add up to ${max} ${cfg.label}.`);
    const accepted: Pending[] = [];
    const problems: string[] = [];
    for (const file of list.slice(0, room)) {
      const heic = /\.(heic|heif)$/i.test(file.name);
      if (!cfg.types.test(file.type) && !(isPhoto && heic)) {
        problems.push(`${file.name}: not a ${isPhoto ? "photo" : "video"}`);
        continue;
      }
      if (file.size > cfg.maxBytes) {
        problems.push(`${file.name}: over ${Math.round(cfg.maxBytes / 1024 / 1024)} MB`);
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: 0, controller: new AbortController() });
    }
    if (list.length > room) problems.push(`only ${room} more ${room === 1 ? "file fits" : "files fit"}`);
    if (problems.length) setNotice(`Skipped — ${problems.join("; ")}.`);
    if (!accepted.length) return;
    setPending((p) => [...p, ...accepted]);
    queue.current.push(...accepted);
    pump();
  }

  function retry(item: Pending) {
    const fresh = { ...item, error: undefined, progress: 0, controller: new AbortController() };
    patch(item.id, fresh);
    queue.current.push(fresh);
    pump();
  }

  function discard(item: Pending) {
    item.controller.abort();
    queue.current = queue.current.filter((q) => q.id !== item.id);
    URL.revokeObjectURL(item.preview);
    setPending((list) => list.filter((p) => p.id !== item.id));
  }

  function move(index: number, to: number) {
    onChange((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function addLink() {
    const url = link.trim();
    if (!/^https:\/\/\S+$/i.test(url)) return setNotice("Use a full https:// link.");
    if (values.includes(url)) return setNotice("That link is already added.");
    if (values.length >= max) return setNotice(`You can add up to ${max} ${cfg.label}.`);
    onChange((prev) => [...prev, url]);
    setLink("");
    setNotice("");
  }

  const full = values.length + pending.length >= max;

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled || full ? -1 : 0}
        aria-disabled={disabled || full}
        onClick={() => !disabled && !full && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !full) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && !full) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/40",
          (disabled || full) && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {isPhoto ? <ImagePlus className="size-6" /> : <Video className="size-6" />}
        </span>
        <span className="font-semibold">{full ? `${max} ${cfg.label} added` : `Drop ${cfg.label} here or tap to choose`}</span>
        <span className="mt-1 text-xs text-muted-foreground">
          {isPhoto ? "JPEG, PNG or WebP, up to 15 MB each. We resize and remove hidden location data." : "MP4, MOV or WebM, up to 60 MB each."}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={cfg.accept}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {notice && (
        <div role="status" className="mt-2 flex items-start gap-1.5 text-xs text-warning">
          <AlertCircle className="mt-px size-3.5 shrink-0" /> {notice}
        </div>
      )}

      {(values.length > 0 || pending.length > 0) && (
        <ul className={cn("mt-4 grid gap-3", isPhoto ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}>
          {values.map((url, i) => (
            <li key={url} className="group relative overflow-hidden rounded-xl border border-border bg-secondary">
              {isPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              ) : /^https:\/\/(www\.)?(youtube|youtu\.be|vimeo)/i.test(url) ? (
                <div className="flex aspect-video items-center gap-2 p-4 text-sm break-all">
                  <Link2 className="size-4 shrink-0" /> {url}
                </div>
              ) : (
                <video src={url} controls preload="metadata" className="aspect-video w-full bg-black" />
              )}
              {isPhoto && i === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="size-3 fill-current" /> Cover
                </span>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button type="button" onClick={() => onChange((prev) => prev.filter((v) => v !== url))} aria-label={`Remove ${isPhoto ? "photo" : "video"} ${i + 1}`} className={iconBtn}>
                  <X className="size-4" />
                </button>
              </div>
              {isPhoto && values.length > 1 && (
                <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move photo ${i + 1} earlier`} className={iconBtn}>
                    <ArrowLeft className="size-4" />
                  </button>
                  {i !== 0 && (
                    <button type="button" onClick={() => move(i, 0)} className="h-8 cursor-pointer rounded-full bg-black/60 px-3 text-xs font-semibold text-white backdrop-blur hover:bg-black/80">
                      Make cover
                    </button>
                  )}
                  <button type="button" disabled={i === values.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move photo ${i + 1} later`} className={iconBtn}>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}
            </li>
          ))}

          {pending.map((p) => (
            <li key={p.id} className="relative overflow-hidden rounded-xl border border-border bg-secondary">
              {isPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.preview} alt="" className={cn("aspect-[4/3] w-full object-cover", !p.error && "opacity-60")} />
              ) : (
                <div className="flex aspect-video items-center justify-center p-4 text-center text-sm text-muted-foreground">{p.file.name}</div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                {p.error ? (
                  <>
                    <span className="rounded-lg bg-black/70 px-2 py-1 text-xs text-white">{p.error}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => retry(p)} className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-[#0b0d12]">
                        <RotateCw className="size-3.5" /> Retry
                      </button>
                      <button type="button" onClick={() => discard(p)} aria-label="Discard" className={iconBtn}>
                        <X className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="size-6 animate-spin text-white drop-shadow" />
                    <button type="button" onClick={() => discard(p)} className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                      Cancel
                    </button>
                  </>
                )}
              </div>
              {!p.error && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" role="progressbar" aria-valuenow={Math.round(p.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${p.file.name}`}>
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(4, p.progress * 100)}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {linkOpen ? (
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
              placeholder={isPhoto ? "https://…/photo.jpg" : "YouTube or Vimeo link"}
              aria-label={isPhoto ? "Photo link" : "Video link"}
              inputMode="url"
              className="h-10 flex-1 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary"
            />
            <button type="button" onClick={addLink} className="h-10 cursor-pointer rounded-xl border border-border px-3.5 text-sm font-semibold hover:text-primary">
              Add
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setLinkOpen(true)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            {isPhoto ? <Upload className="size-3.5" /> : <Link2 className="size-3.5" />}
            {isPhoto ? "Add a photo from a link instead" : "Add a YouTube or Vimeo link instead"}
          </button>
        )}
      </div>
    </div>
  );
}

