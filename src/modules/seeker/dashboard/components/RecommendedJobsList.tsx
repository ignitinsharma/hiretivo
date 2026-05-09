"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { JobCard } from "@/components/shared/JobCard";
import { Card } from "@/components/ui/card";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";
import { seekerService } from "@/services/seeker.service";
import type { SeekerFeedResponse } from "@/services/seeker.service";
import { useUIStore } from "@/store/use-ui-store";

export function RecommendedJobsList() {
  const { openApplyModal, openEmailVerificationModal } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();
  const queryClient = useQueryClient();
  const [dismissingJobId, setDismissingJobId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["seeker-feed"],
    queryFn: seekerService.getFeed,
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
    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

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
            <Card key={i} className="h-56 animate-pulse bg-brand-surface" />
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
