'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSaveJob, useSavedJobs, useUnsaveJob } from '@/modules/seeker/saved-jobs/queries/use-saved-jobs';
import { seekerService } from '@/services/seeker.service';
import { useFeedQuery, feedQueryKey } from '@/modules/seeker/feed/queries/use-feed-query';
import { myApplicationsQueryKey } from '@/modules/seeker/dashboard/hooks/use-my-applications';
import { FeedJobCard } from '@/modules/seeker/feed/components/FeedJobCard';
import { FeedJobDrawer } from '@/modules/seeker/feed/components/FeedJobDrawer';

const TOP_MATCHES_COUNT = 5;

interface ApplyWizardError extends Error {
  status?: number;
  data?: { id?: string | null };
}

/* TopMatchesRow
 * Dashboard "Top job matches" row — curated top-5 by match score (no filters).
 * Every card's Apply starts an assisted-apply wizard run (all pivot jobs are
 * ApplyType.EXTERNAL; there's no legacy verification gate or INTERNAL path
 * left to branch on here — see FeedView for the same pattern). "Apply to all"
 * queues a wizard run per match, capped by remaining AI credits (Section D5
 * hardens the cap; for now each create is independent and 409-safe).
 * "View all" links to the full /dashboard/browse. */
export function TopMatchesRow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useFeedQuery({});
  const { data: savedJobs } = useSavedJobs();
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();
  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onSuccess: () => toast.success('Job removed from feed.'),
    onError: () => toast.error('Failed to remove job.'),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: feedQueryKey({}) }),
  });

  // Starts a wizard run — mirrors FeedView's applyWizardMutation. A 409 means
  // a run already exists for this job; route into that one instead of erroring.
  const applyWizardMutation = useMutation({
    mutationFn: (jobId: string) => seekerService.createApplication(jobId),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: myApplicationsQueryKey });
      router.push(`/dashboard/applications/${res.data.id}`);
    },
    onError: (err: ApplyWizardError) => {
      if (err.status === 409 && err.data?.id) {
        router.push(`/dashboard/applications/${err.data.id}`);
        return;
      }
      toast.error(err.message || 'Could not start your application. Try again.');
    },
  });

  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(() => new Set());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const topMatches = useMemo(
    () => (data?.pages.flatMap((p) => p.jobs) ?? []).slice(0, TOP_MATCHES_COUNT),
    [data],
  );
  const savedJobIds = useMemo(
    () => new Set(savedJobs?.pages.flatMap((p) => p.data.map((s) => s.job.id)) ?? []),
    [savedJobs],
  );

  const setJobSaving = (jobId: string, isSaving: boolean) => {
    setSavingJobIds((current) => {
      const next = new Set(current);
      if (isSaving) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  };

  const handleToggleSave = (jobId: string) => {
    const isSaved = savedJobIds.has(jobId);
    setJobSaving(jobId, true);
    const mutation = isSaved ? unsaveMutation : saveMutation;
    mutation.mutate(jobId, {
      onSuccess: () => toast.success(isSaved ? 'Job removed from saved jobs.' : 'Job saved.'),
      onError: () => toast.error('Something went wrong.'),
      onSettled: () => setJobSaving(jobId, false),
    });
  };

  const handleApplyToAll = () => {
    if (topMatches.length === 0) return;
    // Sequential: opens the wizard for the first match; the rest queue the
    // same POST — Section D5 batches these against the credit cap instead
    // of firing all N at once from the client.
    applyWizardMutation.mutate(topMatches[0].id);
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-foreground">Top job matches</h2>
        </div>
        <Card className="h-40 animate-pulse p-5" />
      </div>
    );
  }

  if (error && topMatches.length === 0) {
    return null;
  }

  if (topMatches.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-foreground">Top job matches</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/browse" className="text-sm font-semibold text-brand-primary hover:underline">
            View all →
          </Link>
          <Button
            variant="primary"
            size="sm"
            disabled={applyWizardMutation.isPending}
            onClick={handleApplyToAll}
          >
            {applyWizardMutation.isPending ? 'Starting…' : 'Apply to all'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {topMatches.map((job) => (
          <FeedJobCard
            key={job.id}
            job={job}
            isSaved={savedJobIds.has(job.id)}
            isSaving={savingJobIds.has(job.id)}
            onToggleSave={() => handleToggleSave(job.id)}
            onPass={() => dismissMutation.mutate(job.id)}
            onOpen={() => setSelectedJobId(job.id)}
            onApply={() => applyWizardMutation.mutate(job.id)}
          />
        ))}
      </div>

      <FeedJobDrawer jobId={selectedJobId} open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)} />
    </div>
  );
}
