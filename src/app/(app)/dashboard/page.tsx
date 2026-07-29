"use client";

import React, { useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { JobDrawer } from "@/components/shared/JobDrawer";
import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";
import { useUIStore } from "@/store/use-ui-store";
import { applicationService } from "@/services/application.service";

export default function DashboardPage() {
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { openAddCustomJobModal } = useUIStore();
  const queryClient = useQueryClient();

  const handleApply = useCallback(
    async (jobId: string) => {
      setDrawerJobId(null);
      setApplyingId(jobId);

      try {
        const app = await applicationService.applyToJob({ jobId });
        applicationService.generateResume(app.id).catch(() => {});
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <button
            onClick={openAddCustomJobModal}
            className="rounded-xl border border-dashed hover:border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center gap-2 min-h-80 border-brand-primary hover:bg-brand-primary/5 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-brand-primary transition-colors">
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-400 group-hover:text-brand-primary transition-colors">
              Add your own job
            </span>
          </button>

          <div className="rounded-xl border border-brand-border bg-brand-surface flex flex-col items-center justify-center gap-3 min-h-80 col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-sm font-semibold text-brand-foreground">
                Live job recommendations are on the way
              </p>
              <p className="text-xs text-brand-foreground-muted mt-1">
                In the meantime, add a job from any company using the card above.
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
