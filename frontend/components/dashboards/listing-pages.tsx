"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getListing } from "@/lib/api";
import { ListingEditor } from "@/components/dashboards/listing-editor";
import { EmptyState, Panel, RowSkeleton } from "@/components/dashboards/ui";

export function NewListingPage({ basePath }: { basePath: string }) {
  return <ListingEditor basePath={basePath} />;
}

export function EditListingPage({ basePath, id }: { basePath: string; id: string }) {
  const token = useAppStore((s) => s.token);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id, token),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Panel className="mx-auto max-w-[900px]">
        <RowSkeleton rows={4} />
      </Panel>
    );
  }
  if (isError || !data) {
    return (
      <Panel className="mx-auto max-w-[900px]">
        <EmptyState icon={Building2} title="Listing not found" description="It may have been deleted." actionLabel="Back to listings" actionHref={`${basePath}/listings`} />
      </Panel>
    );
  }
  return <ListingEditor key={data.listing.updatedAt} basePath={basePath} listing={data.listing} />;
}
