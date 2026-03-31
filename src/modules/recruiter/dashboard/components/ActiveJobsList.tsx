'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

import type { JobStatus } from '@/constants/enums';

interface ActiveJob {
  id: string;
  title: string;
  department: string;
  location: string;
  applicants: number;
  status: 'Active' | 'Urgent' | 'Reviewing';
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Urgent: 'bg-amber-100 text-amber-800',
  Reviewing: 'bg-slate-100 text-slate-800',
};

const ACTIVE_JOBS: ActiveJob[] = [
  { id: '1', title: 'Senior Product Designer', department: 'Design', location: 'Remote', applicants: 84, status: 'Active' },
  { id: '2', title: 'Engineering Manager', department: 'Tech', location: 'New York', applicants: 32, status: 'Active' },
  { id: '3', title: 'Full Stack Developer', department: 'Engineering', location: 'Hybrid', applicants: 156, status: 'Urgent' },
  { id: '4', title: 'Content Strategist', department: 'Marketing', location: 'Remote', applicants: 45, status: 'Active' },
  { id: '5', title: 'HR Specialist', department: 'People', location: 'London', applicants: 12, status: 'Reviewing' },
];

function JobRow({ job }: { job: ActiveJob }) {
  return (
    <div className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div>
        <h3 className="font-bold text-slate-900">{job.title}</h3>
        <p className="text-sm text-slate-500">
          {job.department} • {job.location}
        </p>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="font-bold">{job.applicants}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Applicants
          </p>
        </div>
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full',
            STATUS_STYLES[job.status]
          )}
        >
          {job.status}
        </span>
      </div>
    </div>
  );
}

export function ActiveJobsList() {
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
      <div className="divide-y divide-slate-100">
        {ACTIVE_JOBS.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
