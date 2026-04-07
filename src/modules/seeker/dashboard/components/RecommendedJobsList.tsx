'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { JobCard } from '@/components/shared/JobCard';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import type { JobListItem } from '@/modules/jobs/types/job.types';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedResponse {
  jobs: JobListItem[];
  nextCursor: string | null;
}

async function fetchFeed(): Promise<FeedResponse> {
  const res = await fetch('/api/seeker/feed');
  if (!res.ok) throw new Error('Failed to fetch feed');
  return res.json();
}

export function RecommendedJobsList() {
  const { openApplyModal } = useUIStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['seeker-feed'],
    queryFn: fetchFeed,
  });

  const handleApply = (jobId: string) => {
    openApplyModal(jobId);
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">
              Recommended Jobs
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-primary w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-900">
            Recommended Jobs
          </h2>
        </div>
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">Failed to load recommended jobs. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-900">
            Recommended Jobs
          </h2>
        </div>
        <Button variant="link" size="sm" className="font-semibold px-0">
          View all
        </Button>
      </div>

      {data?.jobs && data.jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={() => handleApply(job.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">No matching jobs found yet. Try updating your skills to see more results.</p>
        </div>
      )}
    </div>
  );
}
