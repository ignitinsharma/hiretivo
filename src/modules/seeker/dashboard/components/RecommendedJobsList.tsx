"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { JobCard } from "@/components/shared/JobCard";
import { Card } from "@/components/ui/card";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";
import type { SeekerFeedResponse } from "@/services/seeker.service";
import { useUIStore } from "@/store/use-ui-store";

async function getEngineerVerificationStatus(): Promise<VerificationStatus> {
  const response = await fetch("/api/engineer/verification");
  if (!response.ok) return VerificationStatus.NOT_SUBMITTED;
  const data = (await response.json()) as { verificationStatus?: VerificationStatus };
  return data.verificationStatus ?? VerificationStatus.NOT_SUBMITTED;
}

export function RecommendedJobsList() {
  const { openApplyModal } = useUIStore();
  const queryClient = useQueryClient();
  const [dismissingJobId, setDismissingJobId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["seeker-feed"],
    queryFn: seekerService.getFeed,
  });
  const { data: verificationStatus = VerificationStatus.NOT_SUBMITTED } = useQuery({
    queryKey: ["engineer-verification-status"],
    queryFn: getEngineerVerificationStatus,
  });

  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onMutate: async (jobId: string) => {
      setDismissingJobId(jobId);
      await queryClient.cancelQueries({ queryKey: ["seeker-feed"] });
      const previousFeed = queryClient.getQueryData<SeekerFeedResponse>([
        "seeker-feed",
      ]);

      queryClient.setQueryData<SeekerFeedResponse>(["seeker-feed"], (current) =>
        current
          ? {
              ...current,
              jobs: current.jobs.filter((job) => job.id !== jobId),
            }
          : current,
      );

      return { previousFeed };
    },
    onError: (error, _jobId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["seeker-feed"], context.previousFeed);
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to remove job.",
      );
    },
    onSuccess: () => {
      toast.success("Job removed from recommendations.");
    },
    onSettled: () => {
      setDismissingJobId(null);
      void queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
    },
  });

  const handleApply = (
    jobId: string,
    title?: string,
    companyName?: string,
    applyType?: string,
    externalApplyUrl?: string | null,
  ) => {
    openApplyModal(jobId, title, companyName, applyType, externalApplyUrl);
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-foreground">Recommended Jobs</h2>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="h-5 w-48 rounded bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-200" />
              </div>
              <div className="grid gap-2 border-t border-brand-border py-4 sm:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 rounded bg-gray-200" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-7 w-20 rounded-lg bg-gray-200" />
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-4">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-9 w-24 rounded-lg bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-foreground">Recommended Jobs</h2>
        </div>
        <Card className="p-8 text-center">
          <p className="text-brand-foreground-muted">
            Failed to load recommended jobs. Please try again.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-brand-primary" />
        <h2 className="text-xl font-bold text-brand-foreground">Recommended Jobs</h2>
      </div>

      {data?.jobs && data.jobs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showDescription
              onNotInterested={() => dismissMutation.mutate(job.id)}
              isDismissing={dismissingJobId === job.id}
              onApply={() =>
                handleApply(
                  job.id,
                  job.title,
                  job.companyName,
                  job.applyType,
                  job.externalApplyUrl,
                )
              }
              verificationStatus={verificationStatus}
              userRole={UserRole.SEEKER}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-brand-foreground-muted">
            No matching jobs found yet. Try updating your skills to see more
            results.
          </p>
        </Card>
      )}
    </div>
  );
}
