'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ActiveJob {
  id: string;
  title: string;
  status: string;
  _count: { applications: number };
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-slate-100 text-slate-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-red-100 text-red-800',
};

export function ActiveJobsList() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiter/jobs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch jobs');
        return res.json();
      })
      .then((data) => {
        setJobs(data.jobs ?? []);
      })
      .catch(() => {
        setJobs([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">My Active Jobs</h2>
        </div>
        <div className="px-8 py-10 text-center text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

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
      {jobs.length === 0 ? (
        <div className="px-8 py-10 text-center text-slate-400 text-sm">
          No active jobs yet. <Link href="/recruiter/jobs" className="text-primary hover:underline">Create your first job</Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <Link key={job.id} href={`/recruiter/jobs?edit=${job.id}`} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
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
                  {job.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
