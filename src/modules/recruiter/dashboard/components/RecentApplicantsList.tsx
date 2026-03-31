'use client';

import { cn } from '@/lib/utils';

interface RecentApplicant {
  id: string;
  name: string;
  position: string;
  status: 'NEW' | 'INTERVIEW' | 'REVIEW' | 'REJECT';
  timeAgo: string;
  initials: string;
}

const APPLICANT_STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-primary/10 text-primary',
  INTERVIEW: 'bg-primary/10 text-primary',
  REVIEW: 'bg-primary/10 text-primary',
  REJECT: 'bg-slate-100 text-slate-800',
};

const RECENT_APPLICANTS_DATA: RecentApplicant[] = [
  { id: '1', name: 'Elena Rossi', position: 'Senior Product Designer', status: 'NEW', timeAgo: '2m ago', initials: 'ER' },
  { id: '2', name: 'Marcus Chen', position: 'Engineering Manager', status: 'INTERVIEW', timeAgo: '1h ago', initials: 'MC' },
  { id: '3', name: 'Sarah Williams', position: 'Full Stack Developer', status: 'NEW', timeAgo: '3h ago', initials: 'SW' },
  { id: '4', name: 'James Miller', position: 'Content Strategist', status: 'REJECT', timeAgo: '5h ago', initials: 'JM' },
  { id: '5', name: 'Amara Okoro', position: 'HR Specialist', status: 'REVIEW', timeAgo: '1d ago', initials: 'AO' },
];

function ApplicantRow({ applicant }: { applicant: RecentApplicant }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-semibold shrink-0">
        {applicant.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{applicant.name}</p>
        <p className="text-xs text-slate-500 truncate">
          for {applicant.position}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full mb-1',
            APPLICANT_STATUS_STYLES[applicant.status]
          )}
        >
          {applicant.status}
        </span>
        <span className="text-[10px] text-slate-500">{applicant.timeAgo}</span>
      </div>
    </div>
  );
}

export function RecentApplicantsList() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Recent Applicants</h2>
      </div>
      <div className="p-6 space-y-6">
        {RECENT_APPLICANTS_DATA.map((applicant) => (
          <ApplicantRow key={applicant.id} applicant={applicant} />
        ))}
      </div>
    </div>
  );
}
