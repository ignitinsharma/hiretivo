'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/use-ui-store';
import { useVerificationStatus } from '@/hooks/use-verification-status';
import { useSaveJob, useSavedJobs, useUnsaveJob } from '@/modules/seeker/saved-jobs/queries/use-saved-jobs';
import { seekerService, type SeekerFeedResponse } from '@/services/seeker.service';
import { useFeedQuery, feedQueryKey } from '@/modules/seeker/feed/queries/use-feed-query';
import { useFeedFilters } from '@/modules/seeker/feed/hooks/use-feed-filters';
import { FeedFilterBar } from '@/modules/seeker/feed/components/FeedFilterBar';
import { FeedJobCard } from '@/modules/seeker/feed/components/FeedJobCard';
import { FeedJobDrawer } from '@/modules/seeker/feed/components/FeedJobDrawer';
import type { FeedJobItem } from '@/modules/seeker/feed/types/feed.types';

interface FeedViewProps {
  companies: string[];
}

/* FeedView
 * Client orchestrator for the /seeker/feed page: URL-synced filters, the filter-aware
 * feed query, save/pass mutations, the detail drawer, and infinite scroll.
 * @param companies - distinct company names passed to FeedFilterBar's multiselect */
export function FeedView({ companies }: FeedViewProps) {
  const { filters, clearFilters, activeCount } = useFeedFilters();
  const queryClient = useQueryClient();
  const { openApplyModal } = useUIStore();
  const hiretivo = useVerificationStatus();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedQuery(filters);
  const { data: savedJobs } = useSavedJobs();
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();

  const [dismissingJobId, setDismissingJobId] = useState<string | null>(null);
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(() => new Set());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const allJobs = useMemo<FeedJobItem[]>(() => data?.pages.flatMap((p) => p.jobs) ?? [], [data]);
  const savedJobIds = useMemo(
    () => new Set(savedJobs?.pages.flatMap((p) => p.data.map((s) => s.job.id)) ?? []),
    [savedJobs],
  );

  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onMutate: async (jobId: string) => {
      setDismissingJobId(jobId);
      const key = feedQueryKey(filters);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ pages: SeekerFeedResponse[]; pageParams: unknown[] }>(key);
      queryClient.setQueryData<{ pages: SeekerFeedResponse[]; pageParams: unknown[] }>(key, (current) =>
        current
          ? { ...current, pages: current.pages.map((page) => ({ ...page, jobs: page.jobs.filter((j) => j.id !== jobId) })) }
          : current,
      );
      return { previous };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previous) queryClient.setQueryData(feedQueryKey(filters), context.previous);
      toast.error('Failed to remove job.');
    },
    onSuccess: () => toast.success('Job removed from feed.'),
    onSettled: () => {
      setDismissingJobId(null);
      void queryClient.invalidateQueries({ queryKey: feedQueryKey(filters) });
    },
  });

  const resolveApplyLockedLabel = (): string | undefined => {
    if (hiretivo.isVerified) return undefined;
    if (hiretivo.status === 'PENDING' || hiretivo.status === 'IN_REVIEW') return 'Verification pending';
    if (hiretivo.status === 'REJECTED') return 'Fix profile to apply';
    return 'Get verified to apply';
  };
  const applyLockedLabel = resolveApplyLockedLabel();

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
      onError: () => toast.error(isSaved ? 'Failed to remove saved job.' : 'Failed to save job.'),
      onSettled: () => setJobSaving(jobId, false),
    });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      <div className="mb-6">
        <FeedFilterBar companies={companies} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse p-5" />
          ))}
        </div>
      ) : error && allJobs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="mb-3 text-brand-foreground-muted">Failed to load the feed. Please try again.</p>
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()}>
            Retry
          </Button>
        </Card>
      ) : allJobs.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/5">
            <Search className="h-8 w-8 text-brand-primary" />
          </div>
          <h3 className="text-lg font-bold text-brand-foreground">
            {activeCount > 0 ? 'No jobs match these filters' : 'No matching jobs yet'}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-brand-foreground-muted leading-relaxed">
            {activeCount > 0
              ? 'Try widening your filters to see more jobs.'
              : 'We couldn’t find jobs matching your current skills. New positions are posted daily — check back soon.'}
          </p>
          {activeCount > 0 && (
            <Button variant="secondary" className="mt-6" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {allJobs.map((job) => (
            <FeedJobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.has(job.id)}
              isSaving={savingJobIds.has(job.id)}
              isDismissing={dismissingJobId === job.id}
              applyLockedLabel={applyLockedLabel}
              onToggleSave={() => handleToggleSave(job.id)}
              onPass={() => dismissMutation.mutate(job.id)}
              onOpen={() => setSelectedJobId(job.id)}
              onApply={() =>
                openApplyModal(job.id, job.title, job.companyName, job.applyType, job.externalApplyUrl)
              }
            />
          ))}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-6">
              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
              <span className="text-sm text-brand-foreground-muted">Loading more...</span>
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}

      <FeedJobDrawer jobId={selectedJobId} open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)} />
    </div>
  );
}
