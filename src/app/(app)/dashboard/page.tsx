"use client";

import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";
import { BrowseJobGrid } from "@/modules/browse/components/BrowseJobGrid";

/*
 * DashboardPage
 * Shows BrowseJobGrid as the primary feed + ApplicationsTable below.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <FreePlanBanner />
      <ResumeParseBanner />

      <div>
        <h2 className="text-lg font-bold text-brand-foreground mb-4">Browse jobs</h2>
        <BrowseJobGrid />
      </div>

      <ApplicationsTable />
    </div>
  );
}
