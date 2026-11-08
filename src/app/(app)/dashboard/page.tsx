"use client";

import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";
import { ApplicationInsights } from "@/modules/dashboard/components/ApplicationInsights";
import { SELF_HOSTED } from "@/lib/config";

/*
 * DashboardPage
 * Application history and resume entry point.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <ApplicationInsights />
      {!SELF_HOSTED && <FreePlanBanner />}
      <ResumeParseBanner />

      <ApplicationsTable />
    </div>
  );
}
