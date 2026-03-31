import React from 'react';
import Link from 'next/link';
import { MoreVertical, Building2 } from 'lucide-react';
import { ApplicationStatus } from '@/constants/enums';
import { cn } from '@/lib/utils';
import type { SeekerApplicationItem } from '../types/application.types';
import { Button } from '@/components/ui/button';

interface ApplicationCardProps {
  application: SeekerApplicationItem;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center p-2 border border-slate-100 text-primary font-bold overflow-hidden">
          {application.companyLogoUrl ? (
            <img
              src={application.companyLogoUrl}
              alt={application.companyName}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="w-6 h-6" />
          )}
        </div>
        <Button variant="icon-ghost" size="icon-sm" className="px-2">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1">
        <Link href={`/jobs/${application.jobId}`}>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">
            {application.jobTitle}
          </h3>
        </Link>
        <p className="text-slate-500 text-sm mb-4">{application.companyName}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
        <StatusBadge status={application.status} />
        <span className="text-xs text-slate-400 font-medium">
          Applied {application.appliedAt}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  let badgeClasses = '';
  let dotClasses = '';
  let label = status;

  switch (status) {
    case ApplicationStatus.SHORTLISTED:
      badgeClasses = 'bg-primary/10 text-primary';
      dotClasses = 'bg-primary';
      label = 'Shortlisted';
      break;
    case ApplicationStatus.REVIEWED:
      badgeClasses = 'bg-primary/5 text-primary/80';
      dotClasses = 'bg-primary/60';
      label = 'Under Review';
      break;
    case ApplicationStatus.PENDING:
      badgeClasses = 'bg-slate-100 text-slate-600';
      dotClasses = 'bg-slate-400';
      label = 'Pending';
      break;
    case ApplicationStatus.REJECTED:
      badgeClasses = 'bg-red-100 text-red-600';
      dotClasses = 'bg-red-500';
      label = 'Declined';
      break;
    case ApplicationStatus.WITHDRAWN:
      badgeClasses = 'bg-slate-100 text-slate-500';
      dotClasses = 'bg-slate-400';
      label = 'Withdrawn';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
        badgeClasses
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses)}></span>
      {label}
    </span>
  );
}