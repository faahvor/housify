"use client";

import { PortfolioOverview } from "@/components/dashboards/portfolio";

export default function LandlordOverviewPage() {
  return (
    <PortfolioOverview
      basePath="/landlord-dashboard"
      audience="renters and buyers"
      inquiriesCopy="When someone asks about one of your properties or requests a viewing, it will appear here."
    />
  );
}
