'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { JobCard } from '@/components/shared/JobCard';
import { RECOMMENDED_JOBS } from '../data/mock-dashboard-data';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';

export function RecommendedJobsList() {
  const { openApplyModal } = useUIStore();

  const handleApply = (jobId: string) => {
    openApplyModal(jobId);
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {RECOMMENDED_JOBS.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onApply={() => handleApply(job.id)}
          />
        ))}
      </div>
    </div>
  );
}