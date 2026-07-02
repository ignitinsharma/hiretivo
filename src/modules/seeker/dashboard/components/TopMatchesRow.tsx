'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUIStore } from '@/store/use-ui-store';
import { useVerificationStatus } from '@/hooks/use-verification-status';
import { useSaveJob, useSavedJobs, useUnsaveJob } from '@/modules/seeker/saved-jobs/queries/use-saved-jobs';
import { seekerService } from '@/services/seeker.service';
import { useFeedQuery, feedQueryKey } from '@/modules/seeker/feed/queries/use-feed-query';
import { FeedJobCard } from '@/modules/seeker/feed/components/FeedJobCard';
import { FeedJobDrawer } from '@/modules/seeker/feed/components/FeedJobDrawer';

const TOP_MATCHES_COUNT = 5;

/* TopMatchesRow
 * Dashboard "Top job matches" row — curated top-5 by match score (no filters), with an
 * "Apply to all" action that stashes the queue in useUIStore().applyQueue (Phase-5 seam)
 * and opens the first job's apply modal. "View all" links to the full /seeker/feed. */
export function TopMatchesRow() {
  const { openApplyModal, enqueueApply } = useUIStore();
  const hiretivo = useVerificationStatus();
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

  const applyLockedLabel = hiretivo.isVerified
    ? undefined
    : hiretivo.status === 'PENDING' || hiretivo.status === 'IN_REVIEW'
      ? 'Verification pending'
      : hiretivo.status === 'REJECTED'
        ? 'Fix profile to apply'
        : 'Get verified to apply';

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
    if (applyLockedLabel || topMatches.length === 0) return;
    enqueueApply(topMatches.map((j) => j.id));
    const first = topMatches[0];
    openApplyModal(first.id, first.title, first.companyName, first.applyType, first.externalApplyUrl);
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
          <Link href="/seeker/feed" className="text-sm font-semibold text-brand-primary hover:underline">
            View all →
          </Link>
          <Button
            variant="primary"
            size="sm"
            disabled={!!applyLockedLabel}
            onClick={handleApplyToAll}
          >
            {applyLockedLabel ?? 'Apply to all'}
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
            applyLockedLabel={applyLockedLabel}
            onToggleSave={() => handleToggleSave(job.id)}
            onPass={() => dismissMutation.mutate(job.id)}
            onOpen={() => setSelectedJobId(job.id)}
            onApply={() =>
              openApplyModal(job.id, job.title, job.companyName, job.applyType, job.externalApplyUrl)
            }
          />
        ))}
      </div>

      <FeedJobDrawer jobId={selectedJobId} open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)} />
    </div>
  );
}
