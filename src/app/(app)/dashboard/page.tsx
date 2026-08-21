"use client";

import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";
import { TopJobRow } from "@/modules/dashboard/components/TopJobRow";

/*
 * DashboardPage
 * Single-row Top job matches (Tsenta parity) + All Applications table.
 * Browse all-jobs lives at /dashboard/browse via BrowseJobGrid.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <FreePlanBanner />
      <ResumeParseBanner />

      <TopJobRow />

      <ApplicationsTable />
    </div>
  );
}
