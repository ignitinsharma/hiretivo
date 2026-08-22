"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useFeed } from "@/hooks/use-feed";
import { PastelJobCard, PastelCardSkeleton } from "@/components/shared/PastelJobCard";
import { JobDrawer } from "@/components/shared/JobDrawer";
import { seekerService } from "@/services/seeker.service";
import { applicationService } from "@/services/application.service";
import { useUIStore } from "@/store/use-ui-store";
import { useGenerationQuota } from "@/hooks/use-generation-quota";
import { useApplicationStatus } from "@/hooks/use-application-status";
import { useSavedJobs, useSaveJob, useUnsaveJob } from "@/modules/seeker/saved-jobs/queries/use-saved-jobs";

/*
 * TopJobRow
 * Dashboard 4-only grid (no scroll) of recommended (matched) jobs — Tsenta Top job matches.
 * 4 cards max, pastel index%5, Pass/Apply. Card Apply opens drawer; drawer Apply generates → toast → remove from row → All Applications.
 */
export function TopJobRow() {
  const queryClient = useQueryClient();
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [jobAppIdMap, setJobAppIdMap] = useState<Record<string, string>>({});
  const [readyJobIds, setReadyJobIds] = useState<Set<string>>(new Set());
  const [failedInfo, setFailedInfo] = useState<Record<string, string>>({});
  const { data: quota } = useGenerationQuota();
  const { openPaidFeatureModal } = useUIStore();
  const generatingJobIds = useUIStore((s) => s.generatingJobIds);
  const addGeneratingJobId = useUIStore((s) => s.addGeneratingJobId);
  const removeGeneratingJobId = useUIStore((s) => s.removeGeneratingJobId);

  const currentAppId = drawerJobId ? jobAppIdMap[drawerJobId] ?? null : null;
  const { data: appStatus } = useApplicationStatus(currentAppId);
  const { data: savedData } = useSavedJobs();
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();
  const savedJobIds = new Set((savedData?.pages.flatMap((p) => p.data.map((s) => s.job.id)) ?? []));

  const { data, isLoading, isError } = useFeed();
  const jobs = (data?.pages.flatMap((p) => p.jobs) ?? []).slice(0, 4);

  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previous = queryClient.getQueryData<any>(["jobs"]);
      queryClient.setQueryData(["jobs"], (old: any) => {
        if (!old?.pages) return old;
        return { ...old, pages: old.pages.map((p: any) => ({ ...p, jobs: p.jobs.filter((j: any) => j.id !== jobId) })) };
      });
      return { previous };
    },
    onError: (_e, _id, ctx: any) => {
      if (ctx?.previous) queryClient.setQueryData(["jobs"], ctx.previous);
      toast.error("Failed to pass");
    },
    onSuccess: () => toast.success("Job passed"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const handleApplyClick = useCallback((jobId: string) => {
    setDrawerJobId(jobId);
  }, []);

  const handlePass = useCallback((jobId: string) => {
    dismissMutation.mutate(jobId);
  }, [dismissMutation]);

  const removeFromRow = useCallback((jobId: string) => {
    queryClient.setQueryData(["jobs"], (old: any) => {
      if (!old?.pages) return old;
      return { ...old, pages: old.pages.map((p: any) => ({ ...p, jobs: p.jobs.filter((j: any) => j.id !== jobId) })) };
    });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  }, [queryClient]);

  const handleGenerate = useCallback(async (jobId: string) => {
    if (generatingJobIds.has(jobId)) return;
    if (quota && !quota.allowed) {
      openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: `You've used all ${quota.limit} generations this month. Upgrade to continue.` });
      return;
    }
    addGeneratingJobId(jobId);
    toast("Resume generation in progress.");
    try {
      const app = await applicationService.ensureApplication(jobId);
      setJobAppIdMap((prev) => ({ ...prev, [jobId]: app.id }));
      await applicationService.generateResume(app.id);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      removeFromRow(jobId);
    } catch (error: any) {
      const apiMsg = error?.response?.data?.error;
      const text = apiMsg ?? (error instanceof Error ? error.message : "Failed to start generation.");
      if (text.toLowerCase().includes("limit") || text.toLowerCase().includes("upgrade")) {
        openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: text });
      } else toast.error(text);
      removeGeneratingJobId(jobId);
    }
  }, [generatingJobIds, quota, openPaidFeatureModal, addGeneratingJobId, removeGeneratingJobId, queryClient, removeFromRow]);

  // Poll for completion
  useEffect(() => {
    if (!drawerJobId || !currentAppId || !appStatus) return;
    const status = appStatus.automationStatus;
    if (status === "READY" && generatingJobIds.has(drawerJobId)) {
      removeGeneratingJobId(drawerJobId);
      setReadyJobIds((prev) => new Set(prev).add(drawerJobId));
      toast.success("Your resume generation is done.");
    } else if (status === "FAILED" && generatingJobIds.has(drawerJobId)) {
      removeGeneratingJobId(drawerJobId);
      setFailedInfo((prev) => ({ ...prev, [drawerJobId]: appStatus.failureReason ?? "Generation failed — please retry" }));
      toast.error(appStatus.failureReason ?? "Resume generation failed.");
    }
  }, [appStatus, drawerJobId, currentAppId, generatingJobIds, removeGeneratingJobId]);

  const drawerGenerationStatus = (() => {
    if (!drawerJobId) return "idle" as const;
    if (readyJobIds.has(drawerJobId)) return "READY" as const;
    if (failedInfo[drawerJobId]) return "FAILED" as const;
    if (generatingJobIds.has(drawerJobId)) return "GENERATING" as const;
    return "idle" as const;
  })();
  const drawerFailureReason = drawerJobId ? failedInfo[drawerJobId] ?? null : null;
  const quotaBlocked = quota ? !quota.allowed : false;

  const handleToggleSave = useCallback((jobId: string) => {
    if (savedJobIds.has(jobId)) {
      unsaveMutation.mutate(jobId, { onSuccess: () => toast.success("Removed from saved"), onError: () => toast.error("Failed to remove") });
    } else {
      saveMutation.mutate(jobId, { onSuccess: () => toast.success("Job saved"), onError: () => toast.error("Failed to save") });
    }
  }, [savedJobIds, saveMutation, unsaveMutation]);

  const handleDownload = useCallback(async (jobId: string) => {
    const appId = jobAppIdMap[jobId];
    if (!appId) return toast.error("No resume found. Generate first.");
    try {
      const res = await fetch(`/api/applications/${appId}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = res.headers.get("Content-Disposition") ?? "";
      const m = disp.match(/filename="?([^"]+)"?/);
      a.download = m?.[1] ?? "Resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Download failed"); }
  }, [jobAppIdMap]);

  const handleMarkApplied = useCallback(async (jobId: string) => {
    const appId = jobAppIdMap[jobId];
    if (!appId) return toast.error("Generate first, then mark as applied.");
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_applied" }) });
      if (!res.ok) throw new Error("Failed to mark as applied");
      toast.success("Marked as applied — check Tracker.");
      setReadyJobIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to mark as applied"); }
  }, [jobAppIdMap, queryClient]);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm font-bold text-brand-foreground mb-3">Top job matches</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <PastelCardSkeleton key={i} index={i} className="w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || jobs.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-bold text-brand-foreground mb-3">Top job matches</h2>
        <p className="text-sm text-brand-foreground-muted">{isError ? "Failed to load top matches." : "No top matches yet — add skills to see personalized jobs."}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-brand-foreground">Top job matches</h2>
        <a href="/dashboard/browse" className="text-xs font-semibold text-brand-primary hover:underline">Browse jobs →</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {jobs.map((job, idx) => (
          <div key={job.id} className="cursor-pointer" onClick={() => handleApplyClick(job.id)}>
            <PastelJobCard job={job} index={idx} className="w-full" onApply={() => handleApplyClick(job.id)} onPass={() => handlePass(job.id)} />
          </div>
        ))}
      </div>
      <JobDrawer
        jobId={drawerJobId}
        open={drawerJobId !== null}
        onOpenChange={(open) => { if (!open) setDrawerJobId(null); }}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        onMarkApplied={handleMarkApplied}
        onToggleSave={drawerJobId ? () => handleToggleSave(drawerJobId) : undefined}
        isSaved={drawerJobId ? savedJobIds.has(drawerJobId) : false}
        generationStatus={drawerGenerationStatus}
        failureReason={drawerFailureReason}
        applyLockedLabel={quotaBlocked ? "Upgrade plan" : undefined}
      />
    </div>
  );
}
