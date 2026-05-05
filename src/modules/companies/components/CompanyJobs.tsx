import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CompanyJob {
  id: string;
  title: string;
  jobType: string;
  workType: string | null;
  salaryRange: string;
  experienceLevel: string | null;
}

interface CompanyJobsProps {
  jobs: CompanyJob[];
}

function formatEnumLabel(value?: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function CompanyJobs({ jobs }: CompanyJobsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Open Positions</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
        </span>
      </div>

      {jobs.length === 0 && (
        <p className="text-sm text-slate-500">No open roles right now.</p>
      )}

      <div className="divide-y divide-slate-100">
        {jobs.map((job) => (
          <div key={job.id} className="group flex flex-col sm:flex-row sm:items-center justify-between py-5 first:pt-0 last:pb-0 gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {formatEnumLabel(job.jobType)}
                </span>
                {job.workType && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {formatEnumLabel(job.workType)}
                  </span>
                )}
                {job.experienceLevel && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {job.experienceLevel}
                  </span>
                )}
                <span className="text-sm font-semibold text-black">{job.salaryRange}</span>
              </div>
            </div>
            <Link href={`/jobs/${job.id}`} className="flex items-center gap-1 text-sm font-bold text-primary shrink-0">
              View <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
