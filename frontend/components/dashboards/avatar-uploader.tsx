"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { updateMe, uploadFile, type MeUser } from "@/lib/api";
import { Avatar } from "@/components/avatar";

export function AvatarUploader({ me }: { me: MeUser }) {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async (file: File | null) => {
      if (!file) return updateMe(token!, { avatarUrl: "" });
      if (file.size > 8 * 1024 * 1024) throw new Error("Choose a photo under 8 MB.");
      setProgress(0);
      const up = await uploadFile(token!, "avatar", file, { onProgress: setProgress });
      return updateMe(token!, { avatarUrl: up.url });
    },
    onSuccess: ({ user }) => queryClient.setQueryData(["me"], user),
    onSettled: () => setProgress(null),
  });

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={save.isPending}
        aria-label={me.avatarUrl ? "Change profile photo" : "Add a profile photo"}
        className="group relative shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Avatar name={me.name} src={me.avatarUrl} size={64} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="size-5" />
        </span>
        {save.isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-xs font-semibold text-white">
            {progress !== null && progress < 1 ? `${Math.round(progress * 100)}%` : <Loader2 className="size-5 animate-spin" />}
          </span>
        )}
      </button>
      <div className="flex flex-col items-start gap-1">
        <button type="button" onClick={() => input.current?.click()} disabled={save.isPending} className="cursor-pointer text-sm font-semibold text-primary hover:underline disabled:opacity-50">
          {me.avatarUrl ? "Change photo" : "Add a profile photo"}
        </button>
        {me.avatarUrl && (
          <button
            type="button"
            onClick={() => save.mutate(null)}
            disabled={save.isPending}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        )}
        {save.isError && (
          <span role="alert" className="text-xs text-destructive">
            {save.error.message}
          </span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) save.mutate(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
