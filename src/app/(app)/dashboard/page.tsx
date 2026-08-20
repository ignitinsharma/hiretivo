"use client";

import React, { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { JobDrawer } from "@/components/shared/JobDrawer";
import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";
import { applicationService } from "@/services/application.service";

export default function DashboardPage() {
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleApply = useCallback(
    async (jobId: string) => {
      setDrawerJobId(null);
      setApplyingId(jobId);

      try {
        const app = await applicationService.applyToJob({ jobId });
        await applicationService.generateResume(app.id);
        await queryClient.invalidateQueries({ queryKey: ["applications"] });
        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        window.location.href = "/dashboard/tracker";
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to apply. Please try again.";
        toast.error(message);
      } finally {
        setApplyingId(null);
      }
    },
    [queryClient],
  );

  return (
    <div className="space-y-6">
      <FreePlanBanner />
      <ResumeParseBanner />

      <div>
        <h2 className="text-lg font-bold text-brand-foreground mb-4 flex items-center gap-2">
          Recommended jobs
          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
            Coming soon
          </span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface flex flex-col items-center justify-center gap-3 min-h-80 col-span-2 lg:col-span-3 xl:col-span-4 px-4">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-sm font-semibold text-brand-foreground">
                Your go-to for remote jobs
              </p>
              <p className="text-xs text-brand-foreground-muted mt-1">
                Browse jobs right here instead of hopping between platforms. Found one elsewhere? We&apos;ll tailor your resume for it.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ApplicationsTable />

      <JobDrawer
        jobId={drawerJobId}
        open={drawerJobId !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerJobId(null);
        }}
        onApply={handleApply}
      />
    </div>
  );
}
