"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError, onSessionEnded } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Don't retry auth/permission/validation failures — they won't fix themselves.
            retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
          },
        },
      })
  );

  useEffect(() => {
    onSessionEnded((reason, message) => {
      if (!useAppStore.getState().loggedIn) return;
      useAppStore.getState().logOut(reason === "blocked" ? message : "Your session expired. Please sign in again.");
      queryClient.clear();
      router.replace("/sign-in");
    });
  }, [queryClient, router]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
