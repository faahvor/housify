"use client";

import { use } from "react";
import { AdminPersonPage } from "@/components/dashboards/admin-person";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminPersonPage id={id} />;
}
