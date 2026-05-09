"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SeekerOnboardingStep } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";

interface StepSeekerCompleteProps {
  onComplete: () => Promise<
    | { success: true; redirectTo: "/seeker/settings" }
    | {
        success: false;
        error: string;
        missingStep: SeekerOnboardingStep;
      }
  >;
}

interface OnboardingFeedJob {
  id: string;
  title: string;
  companyName: string;
  salaryRange: string;
  matchScore?: number;
}

interface OnboardingFeedResponse {
  jobs: OnboardingFeedJob[];
  remainingCount?: number;
  totalCount?: number;
}

export function StepSeekerComplete({ onComplete }: StepSeekerCompleteProps) {
  const [feed, setFeed] = useState<OnboardingFeedResponse | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeed(): Promise<void> {
      try {
        const response = await fetch("/api/seeker/feed?limit=3", {
          signal: controller.signal,
        });
        if (!response.ok) {
          setFeed({ jobs: [] });
          return;
        }
        const data = (await response.json()) as OnboardingFeedResponse;
        setFeed(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "[StepSeekerComplete] Failed to load seeker feed:",
            error,
          );
          setFeed({ jobs: [] });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingFeed(false);
        }
      }
    }

    void loadFeed();

    return () => controller.abort();
  }, []);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setCompletionError(null);
    try {
      const result = await onComplete();
      if (result?.success === false) {
        setCompletionError(result.error);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const jobs = feed?.jobs ?? [];
  const remainingCount = feed?.remainingCount ?? null;
  const totalCount = feed?.totalCount ?? jobs.length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">
            You&apos;re ready!
          </h2>
          <p className="text-lg text-muted-foreground">
            {totalCount > 0 ? (
              <>
                Your profile is ready. We found{" "}
                <span className="font-semibold text-primary">{totalCount}</span>{" "}
                matching {totalCount === 1 ? "job" : "jobs"} for your skills.
              </>
            ) : (
              "Your profile is ready. New matched jobs will appear as recruiters post roles that fit your skills."
            )}
          </p>
        </div>

        <div className="space-y-3 py-4">
          {isLoadingFeed ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Loading matched jobs...
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BriefcaseBusiness className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.companyName} • {job.salaryRange}
                    </p>
                  </div>
                </div>
                {job.matchScore != null && (
                  <span className="text-sm font-semibold text-primary">
                    {job.matchScore}%
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No matching jobs yet. Keep building your profile so the feed can
              improve as new roles are posted.
            </div>
          )}
        </div>

        {remainingCount != null && remainingCount > 0 && (
          <div className="bg-muted/50 rounded-lg py-3 px-4">
            <p className="text-sm text-muted-foreground">
              {remainingCount} more {remainingCount === 1 ? "job" : "jobs"}{" "}
              waiting for you
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {completionError && (
            <p className="text-sm text-destructive text-center">
              {completionError}
            </p>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleComplete}
            size="lg"
            className="w-full"
            loading={isCompleting}
            loadingText="Saving..."
          >
            Complete my full profile
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Chat with support
          </Link>
        </p>
      </div>
    </div>
  );
}
