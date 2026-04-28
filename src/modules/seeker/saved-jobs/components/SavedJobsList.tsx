"use client";

import React from "react";
import { Bookmark, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/shared/JobCard";
import { useUIStore } from "@/store/use-ui-store";

import { useSavedJobs, useUnsaveJob } from "../queries/use-saved-jobs";

const SKELETON_ITEMS = Array.from({ length: 3 }, (_, index) => `saved-job-${index}`);

export function SavedJobsList() {
  const { openApplyModal } = useUIStore();
  const { data: savedJobs, isLoading, isError } = useSavedJobs();
  const unsaveMutation = useUnsaveJob();

  const handleRemove = (jobId: string): void => {
    unsaveMutation.mutate(jobId, {
      onSuccess: () => toast.success("Job removed from saved jobs."),
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to remove saved job.");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SKELETON_ITEMS.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-[rgba(89,82,229,0.12)_0px_0px_0px_1px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="mb-8 h-4 w-1/2" />
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-[18px] font-semibold leading-[1.44] text-foreground ">
          Saved jobs could not be loaded.
        </p>
      </div>
    );
  }

  if (!savedJobs || savedJobs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-black">
          <Bookmark className="h-5 w-5" />
        </div>
        <h2 className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-foreground ">
          No saved jobs yet
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[18px] font-normal leading-[1.44] tracking-[0.18px] text-[#454745] ">
          Save jobs from your recommendations so the strongest matches stay easy to revisit.
        </p>
        <Button asChild className="mt-6 rounded-full bg-black text-white transition-transform hover:scale-105 active:scale-95">
          <a href="/seeker/dashboard">Browse recommendations</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[#454745]">
        <BriefcaseBusiness className="h-5 w-5 text-black" />
        <p className="text-[14px] font-semibold leading-[1.5] ">
          {savedJobs.length} saved {savedJobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {savedJobs.map((savedJob) => (
          <JobCard
            key={savedJob.id}
            job={savedJob.job}
            isSaved
            onApply={
              savedJob.application || savedJob.job.isClosed
                ? undefined
                : () => openApplyModal(savedJob.job.id, savedJob.job.title, savedJob.job.companyName)
            }
            onToggleSave={() => handleRemove(savedJob.job.id)}
          />
        ))}
      </div>
    </div>
  );
}
