'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/constants/enums';
import type { RecentApplicant } from '@/modules/recruiter/dashboard/types/dashboard.types';

const STATUS_STYLES: Record<string, string> = {
  [ApplicationStatus.APPLIED]: 'bg-blue-100 text-blue-700',
  [ApplicationStatus.REVIEWING]: 'bg-amber-100 text-amber-700',
  [ApplicationStatus.INTERVIEW]: 'bg-primary/10 text-primary',
  [ApplicationStatus.OFFER]: 'bg-brand-primary-light text-brand-primary',
  [ApplicationStatus.HIRED]: 'bg-brand-primary-light text-brand-primary',
  [ApplicationStatus.REJECTED]: 'bg-slate-100 text-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  [ApplicationStatus.APPLIED]: 'New',
  [ApplicationStatus.REVIEWING]: 'Reviewing',
  [ApplicationStatus.INTERVIEW]: 'Interview',
  [ApplicationStatus.OFFER]: 'Offer',
  [ApplicationStatus.HIRED]: 'Hired',
  [ApplicationStatus.REJECTED]: 'Rejected',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ApplicantRow({ applicant }: { applicant: RecentApplicant }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
        {getInitials(applicant.seekerName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 truncate">{applicant.seekerName}</p>
        <p className="text-xs text-slate-500 truncate">
          for {applicant.jobTitle}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1">
        <span
          className={cn(
            'text-[10px] font-bold px-2.5 py-0.5 rounded-full',
            STATUS_STYLES[applicant.status] ?? 'bg-slate-100 text-slate-600'
          )}
        >
          {STATUS_LABELS[applicant.status] ?? applicant.status}
        </span>
        <span className="text-[10px] text-slate-400">
          {formatTimeAgo(applicant.appliedDate)}
        </span>
      </div>
    </div>
  );
}

interface RecentApplicantsListProps {
  applicants: RecentApplicant[];
  isLoading?: boolean;
}

export function RecentApplicantsList({ applicants, isLoading }: RecentApplicantsListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full h-full">
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Recent Applicants</h2>
        <Link
          href="/recruiter/applicants"
          className="text-primary font-semibold text-sm hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="p-6 space-y-5 flex-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : applicants.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No applicants yet</p>
        ) : (
          applicants.map((applicant) => (
            <ApplicantRow key={applicant.id} applicant={applicant} />
          ))
        )}
      </div>
    </div>
  );
}