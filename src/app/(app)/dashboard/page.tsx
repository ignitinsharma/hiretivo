"use client";

import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";

/*
 * DashboardPage
 * Application history and resume entry point.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <FreePlanBanner />
      <ResumeParseBanner />

      <ApplicationsTable />
    </div>
  );
}
