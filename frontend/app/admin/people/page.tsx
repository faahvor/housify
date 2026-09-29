"use client";

import { Suspense } from "react";
import { PeopleDirectory } from "@/components/dashboards/admin-directory";

export default function Page() {
  return (
    <Suspense>
      <PeopleDirectory />
    </Suspense>
  );
}
