'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSaveJob, useSavedJobs, useUnsaveJob } from '@/modules/seeker/saved-jobs/queries/use-saved-jobs';
import { seekerService, type SeekerFeedResponse } from '@/services/seeker.service';
import { useFeedQuery, feedQueryKey } from '@/modules/seeker/feed/queries/use-feed-query';
import { useFeedFilters } from '@/modules/seeker/feed/hooks/use-feed-filters';
import { FeedFilterBar } from '@/modules/seeker/feed/components/FeedFilterBar';
import { FeedJobCard } from '@/modules/seeker/feed/components/FeedJobCard';
import { FeedJobDrawer } from '@/modules/seeker/feed/components/FeedJobDrawer';
import type { FeedJobItem } from '@/modules/seeker/feed/types/feed.types';

interface ApplyWizardError extends Error {
  status?: number;
  data?: { id?: string | null };
}

interface FeedViewProps {
  companies: string[];
}

/* FeedView
 * Client orchestrator for the /dashboard/browse page: URL-synced filters, the filter-aware
 * feed query, save/pass mutations, the detail drawer, and infinite scroll.
 * @param companies - distinct company names passed to FeedFilterBar's multiselect */
export function FeedView({ companies }: FeedViewProps) {
  const { filters, clearFilters, activeCount } = useFeedFilters();
  const queryClient = useQueryClient();
  const router = useRouter();

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

  // Starts a wizard run — every seeker apply goes through the assisted-apply
  // flow regardless of the job's legacy applyType (ApplyJobModal is no
  // longer mounted on any seeker surface — see D2). A 409 means a run
  // already exists for this job; route into that one instead of erroring.
  const applyWizardMutation = useMutation({
    mutationFn: (jobId: string) => seekerService.createApplication(jobId),
    onSuccess: (res) => router.push(`/dashboard/applications/${res.data.id}`),
    onError: (err: ApplyWizardError) => {
      if (err.status === 409 && err.data?.id) {
        router.push(`/dashboard/applications/${err.data.id}`);
        return;
      }
      toast.error(err.message || 'Could not start your application. Try again.');
    },
  });

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

  const savedCount = savedJobs?.pages[0]?.pagination.total ?? 0;

  return (
    <div>
      <div className="mb-3">
        <FeedFilterBar companies={companies} />
      </div>
      <p className="mb-6 text-sm text-brand-foreground-muted">
        {savedCount > 0 ? `${savedCount} saved job${savedCount === 1 ? '' : 's'}` : 'No saved jobs yet'}
      </p>

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
              onToggleSave={() => handleToggleSave(job.id)}
              onPass={() => dismissMutation.mutate(job.id)}
              onOpen={() => setSelectedJobId(job.id)}
              onApply={() => applyWizardMutation.mutate(job.id)}
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

      <FeedJobDrawer
        jobId={selectedJobId}
        open={!!selectedJobId}
        onOpenChange={(open) => !open && setSelectedJobId(null)}
        isSaved={!!selectedJobId && savedJobIds.has(selectedJobId)}
        isSaving={!!selectedJobId && savingJobIds.has(selectedJobId)}
        isDismissing={dismissingJobId === selectedJobId}
        onToggleSave={() => selectedJobId && handleToggleSave(selectedJobId)}
        onPass={() => {
          if (!selectedJobId) return;
          dismissMutation.mutate(selectedJobId);
          setSelectedJobId(null);
        }}
        onApply={() => selectedJobId && applyWizardMutation.mutate(selectedJobId)}
        searchTerm={filters.search}
      />
    </div>
  );
}
