"use client";

import { ListingsManager } from "@/components/dashboards/portfolio";

export default function ListingsPage() {
  return <ListingsManager audience="renters and buyers" basePath="/landlord-dashboard" />;
}
