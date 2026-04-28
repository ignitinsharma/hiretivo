'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { JobStatus } from '@/constants/enums';
import { Plus, ArrowRight } from 'lucide-react';
import { recruiterService } from '@/services/recruiter.service';
import type { ActiveJob } from '@/services/recruiter.service';

const MAX_JOBS_DISPLAY = 5;

const STATUS_STYLES: Record<string, string> = {
  [JobStatus.OPEN]: 'bg-gray-100 text-black',
  [JobStatus.UNPUBLISHED]: 'bg-amber-100 text-amber-800',
  [JobStatus.DELETED]: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  [JobStatus.OPEN]: 'Active',
  [JobStatus.UNPUBLISHED]: 'Unpublished',
  [JobStatus.DELETED]: 'Deleted',
};

export function ActiveJobsList() {
  const { data: jobs = [], isLoading } = useQuery<ActiveJob[]>({
    queryKey: ['recruiter-active-jobs'],
    queryFn: recruiterService.getActiveJobs,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full">
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">My Active Jobs</h2>
        <Link
          href="/recruiter/jobs"
          className="text-primary font-semibold text-sm hover:underline"
        >
          View all
        </Link>
      </div>
      {isLoading ? (
        <div className="divide-y divide-slate-100 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-8 ml-auto" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-10 text-center w-full">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <div className="relative">
                <div className="h-10 w-14 rounded-md bg-primary/20">
                  <div className="mx-2 mt-2 space-y-1.5">
                    <div className="h-1.5 w-6 rounded-full bg-primary/40" />
                    <div className="h-1.5 w-8 rounded-full bg-primary/30" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No active jobs yet.</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create your first job and start attracting top talent.
            </p>
            <Link
              href="/recruiter/jobs"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              Create Your First Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="divide-y divide-slate-100 flex-1">
            {jobs.slice(0, MAX_JOBS_DISPLAY).map((job) => (
              <Link
                key={job.id}
                href={`/recruiter/jobs?edit=${job.id}`}
                className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="font-bold">{job._count.applications}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      Applicants
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full',
                      STATUS_STYLES[job.status] ?? 'bg-slate-100 text-slate-800'
                    )}
                  >
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {jobs.length > MAX_JOBS_DISPLAY && (
            <div className="border-t border-slate-200 px-6 py-4">
              <Link
                href="/recruiter/jobs"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                See more ({jobs.length - MAX_JOBS_DISPLAY} more)
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
