"use client";

import { use } from "react";
import { EditListingPage } from "@/components/dashboards/listing-pages";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditListingPage basePath="/landlord-dashboard" id={id} />;
}
