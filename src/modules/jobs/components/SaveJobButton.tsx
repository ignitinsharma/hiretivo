"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { UserRole } from "@/constants/enums";
import { cn } from "@/lib/utils";
import { useSavedJobs, useSaveJob, useUnsaveJob } from "@/modules/seeker/saved-jobs/queries/use-saved-jobs";
import { Button } from "@/components/ui/button";

interface SaveJobButtonProps {
  jobId: string;
  isAuth: boolean;
  userRole: string | null;
  className?: string;
  fullWidth?: boolean;
  savedLabel?: string;
  unsavedLabel?: string;
}

export function SaveJobButton({
  jobId,
  isAuth,
  userRole,
  className,
  fullWidth = false,
  savedLabel = "Saved",
  unsavedLabel = "Save",
}: SaveJobButtonProps) {
  const router = useRouter();
  const canQuerySavedJobs = isAuth && userRole === UserRole.SEEKER;
  const { data: savedJobs, isLoading } = useSavedJobs({ enabled: canQuerySavedJobs });
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();
  const isSaved = savedJobs?.some((savedJob) => savedJob.job.id === jobId) ?? false;
  const isPending = saveMutation.isPending || unsaveMutation.isPending;
  const isBusy = canQuerySavedJobs && (isLoading || isPending);

  const handleToggleSave = (): void => {
    if (!isAuth) {
      toast.info("Sign in as a job seeker to save jobs.");
      router.push(`/seeker/login?redirect=/jobs/${jobId}`);
      return;
    }

    if (userRole !== UserRole.SEEKER) {
      toast.error("Only job seekers can save jobs.");
      return;
    }

    if (isSaved) {
      unsaveMutation.mutate(jobId, {
        onSuccess: () => toast.success("Job removed from saved jobs."),
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to remove saved job.");
        },
      });
      return;
    }

    saveMutation.mutate(jobId, {
      onSuccess: () => toast.success("Job saved."),
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to save job.");
      },
    });
  };

  return (
    <Button
      type="button"
      variant={isSaved ? "secondary" : "default"}
      className={cn(fullWidth && "w-full", className)}
      loading={isBusy}
      disabled={isBusy}
      aria-pressed={isSaved}
      onClick={handleToggleSave}
    >
      <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
      {isSaved ? savedLabel : unsavedLabel}
    </Button>
  );
}
