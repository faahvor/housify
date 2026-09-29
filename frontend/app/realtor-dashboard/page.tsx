"use client";

import { PortfolioOverview } from "@/components/dashboards/portfolio";

export default function RealtorOverviewPage() {
  return (
    <PortfolioOverview
      basePath="/realtor-dashboard"
      audience="prospective buyers and tenants"
      inquiriesCopy="When a prospect asks about a property you represent or requests a viewing, it will appear here."
    />
  );
}
