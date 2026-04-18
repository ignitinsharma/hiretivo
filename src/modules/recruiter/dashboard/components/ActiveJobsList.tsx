'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { JobStatus } from '@/constants/enums';

interface ActiveJob {
  id: string;
  title: string;
  status: string;
  _count: { applications: number };
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  [JobStatus.OPEN]: 'bg-brand-primary-light text-brand-primary',
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
    queryFn: async () => {
      const res = await fetch('/api/recruiter/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const json = await res.json();
      return json.jobs ?? [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-8 py-6 flex items-center justify-between border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">My Active Jobs</h2>
        <Link
          href="/recruiter/jobs"
          className="text-primary font-semibold text-sm hover:underline"
        >
          View all
        </Link>
      </div>
      {isLoading ? (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-8 py-5 flex items-center justify-between">
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
        <div className="px-8 py-10 text-center text-slate-400 text-sm">
          No active jobs yet.{' '}
          <Link href="/recruiter/jobs" className="text-primary hover:underline">
            Create your first job
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/recruiter/jobs?edit=${job.id}`}
              className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
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
      )}
    </div>
  );
}