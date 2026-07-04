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
import { useCreditStatus, creditStatusQueryKey } from '@/modules/seeker/dashboard/hooks/use-credit-status';
import { SEEKER_CREDITS_QUERY_KEY } from '@/hooks/use-credits';
import { loadBatchApplyProfileContext, generateApplicationArtifacts } from '@/modules/seeker/dashboard/utils/batch-apply';
import type { BatchApplyResult } from '@/modules/seeker/dashboard/utils/batch-apply';
import { useUIStore } from '@/store/use-ui-store';
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
 * (Section D5) batch-generates a resume + cover letter for as many top
 * matches as remaining credits cover (1 credit/job) and lands each in the
 * dashboard table's Needs-you tab via a partial finalize (no submittedFormData
 * yet — see batch-apply.ts + the finalize route's two-step contract);
 * "Approve all" on the table later confirms those as Submitted.
 * "View all" links to the full /dashboard/browse. */
export function TopMatchesRow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useFeedQuery({});
  const { data: savedJobs } = useSavedJobs();
  const { data: creditStatus } = useCreditStatus();
  const openPaidFeatureModal = useUIStore((s) => s.openPaidFeatureModal);
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

  // Batch-generates resume + cover letter for as many top matches as
  // remaining credits allow (1 credit per job — see batch-apply.ts), landing
  // each in the Needs-you tab. Sequential, not parallel: optimize-resume and
  // cover-letter each have their own 5/min rate limiter, and createApplication
  // + finalize share a 10/min write limiter — running N>~5 jobs concurrently
  // would trip those limits before credits ever ran out.
  const applyToAllMutation = useMutation({
    mutationFn: async () => {
      const remaining = creditStatus?.remaining ?? 0;
      const queue = topMatches.slice(0, remaining);
      const ctx = await loadBatchApplyProfileContext();
      const results: BatchApplyResult[] = [];
      for (const job of queue) {
        results.push(await generateApplicationArtifacts(job, ctx));
      }
      return { results, skipped: topMatches.length - queue.length };
    },
    onSuccess: ({ results, skipped }) => {
      const succeeded = results.filter((r) => r.success).length;
      if (succeeded > 0) {
        void queryClient.invalidateQueries({ queryKey: myApplicationsQueryKey });
        void queryClient.invalidateQueries({ queryKey: creditStatusQueryKey });
        void queryClient.invalidateQueries({ queryKey: SEEKER_CREDITS_QUERY_KEY });
      }
      const failed = results.length - succeeded;
      if (results.length === 0) {
        toast.error('No credits remaining — upgrade to apply to more jobs.');
      } else if (failed === 0 && skipped === 0) {
        toast.success(`Queued ${succeeded} of ${topMatches.length} applications.`);
      } else {
        const skippedNote = skipped > 0 ? ` (${skipped} skipped — out of credits)` : '';
        toast.success(`Queued ${succeeded} of ${topMatches.length} applications${skippedNote}.`);
        if (failed > 0) toast.error(`${failed} application${failed === 1 ? '' : 's'} failed to generate.`);
      }
    },
    onError: () => toast.error('Could not start Apply to all. Try again.'),
  });

  const handleApplyToAll = () => {
    if (topMatches.length === 0) return;
    if ((creditStatus?.remaining ?? 0) <= 0) {
      openPaidFeatureModal({
        feature: 'ai_credits',
        title: 'Out of AI credits this month',
        description: 'Upgrade to Pro (400/mo) or Max (1000/mo) to apply to more jobs.',
      });
      return;
    }
    applyToAllMutation.mutate();
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
            disabled={applyToAllMutation.isPending}
            onClick={handleApplyToAll}
          >
            {applyToAllMutation.isPending ? 'Applying…' : 'Apply to all'}
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
