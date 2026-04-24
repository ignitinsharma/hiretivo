'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { cn } from '@/lib/utils';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ApplicationStatus, PlanTier } from '@/constants/enums';
import { getStageLabel } from '@/lib/application-pipeline';
import { CandidateDrawer, type CandidateApplication } from '@/modules/recruiter/applications/components/CandidateDrawer';
import { useUIStore } from '@/store/use-ui-store';

type RecruiterApplicationsResponse = {
  applications: CandidateApplication[];
  meta: {
    recruiterPlan: PlanTier;
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};

type RecruiterStatsResponse = {
  total: number;
  applied: number;
  reviewing: number;
  interview: number;
  hired: number;
};

async function fetchRecruiterStats(jobId?: string): Promise<RecruiterStatsResponse> {
  const query = new URLSearchParams();
  if (jobId) {
    query.set('jobId', jobId);
  }
  const response = await fetch(`/api/recruiter/applications/stats?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load stats');
  }
  return response.json();
}

async function fetchRecruiterApplications(
  cursor: string | null,
  stage: ApplicationStatus | null,
  search: string,
  jobId?: string,
): Promise<RecruiterApplicationsResponse> {
  const query = new URLSearchParams();
  if (jobId) {
    query.set('jobId', jobId);
  }
  if (stage) {
    query.set('stage', stage);
  }
  if (search.trim()) {
    query.set('search', search.trim());
  }
  if (cursor) {
    query.set('cursor', cursor);
  }
  query.set('limit', '25');

  const response = await fetch(`/api/recruiter/applications?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load applications');
  }
  return response.json();
}

function getMatchLabel(score: number): string {
  if (score >= 90) return 'Expert Match';
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  return 'Partial Match';
}

function getStatusPillClasses(status: ApplicationStatus): string {
  switch (status) {
    case ApplicationStatus.APPLIED:
      return 'bg-slate-100 text-slate-700';
    case ApplicationStatus.REVIEWING:
      return 'bg-blue-100 text-blue-700';
    case ApplicationStatus.INTERVIEW:
      return 'bg-primary/10 text-primary';
    case ApplicationStatus.OFFER:
      return 'bg-amber-100 text-amber-700';
    case ApplicationStatus.HIRED:
      return 'bg-brand-primary-light text-brand-primary';
    case ApplicationStatus.REJECTED:
      return 'bg-red-100 text-red-700';
  }
}

export default function RecruiterApplicationsPage() {
  const [jobId] = useState<string | undefined>(undefined);
  const [stageFilter, setStageFilter] = useState<ApplicationStatus | null>(null);
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([null]);

  const { openCandidateDrawer, selectedApplicationId } = useUIStore();

  const statsQuery = useQuery({
    queryKey: ['recruiter-application-stats', jobId],
    queryFn: () => fetchRecruiterStats(jobId),
  });

  const applicationsQuery = useQuery({
    queryKey: ['recruiter-applications', jobId, stageFilter, search, cursor],
    queryFn: () => fetchRecruiterApplications(cursor, stageFilter, search, jobId),
  });

  const applications = applicationsQuery.data?.applications ?? [];
  const selectedApplication = applications.find((app) => app.id === selectedApplicationId) ?? null;
  const recruiterPlan = applicationsQuery.data?.meta.recruiterPlan ?? PlanTier.FREE;

  const metricCards = useMemo(
    () => [
      { label: 'Total', value: statsQuery.data?.total ?? 0, stage: null as ApplicationStatus | null },
      { label: 'Applied', value: statsQuery.data?.applied ?? 0, stage: ApplicationStatus.APPLIED },
      { label: 'Reviewing', value: statsQuery.data?.reviewing ?? 0, stage: ApplicationStatus.REVIEWING },
      { label: 'Interview', value: statsQuery.data?.interview ?? 0, stage: ApplicationStatus.INTERVIEW },
      { label: 'Hired', value: statsQuery.data?.hired ?? 0, stage: ApplicationStatus.HIRED },
    ],
    [statsQuery.data],
  );

  if (statsQuery.isLoading || applicationsQuery.isLoading) {
    return (
      <div className="w-full p-8">
        <PageSkeleton lines={8} showHeader={true} showFilters={true} />
      </div>
    );
  }

  const handleStageFilter = (stage: ApplicationStatus | null) => {
    setStageFilter(stage);
    setCursor(null);
    setCursorHistory([null]);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCursor(null);
    setCursorHistory([null]);
  };

  const goNextPage = () => {
    const nextCursor = applicationsQuery.data?.meta.nextCursor ?? null;
    if (!nextCursor) {
      return;
    }
    setCursor(nextCursor);
    setCursorHistory((previous) => [...previous, nextCursor]);
  };

  const goPreviousPage = () => {
    if (cursorHistory.length <= 1) {
      return;
    }
    const nextHistory = cursorHistory.slice(0, -1);
    setCursorHistory(nextHistory);
    setCursor(nextHistory[nextHistory.length - 1] ?? null);
  };

  return (
    <div className="w-full p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <SidebarToggle />
              <nav className="flex items-center text-[10px] font-bold text-indigo-500 tracking-widest uppercase">
                <span>Active Recruitment</span>
                <ChevronRight className="w-3 h-3 mx-1" />
                <span className="text-slate-400">Applicants</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Applicants Explorer</h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold uppercase tracking-wider">
                {applicationsQuery.isLoading ? '...' : `${statsQuery.data?.total ?? 0} Candidates`}
              </span>
            </div>
            <p className="text-base text-slate-500 font-medium">Deep-dive candidate analysis and management</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export List
            </Button>
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Candidate
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Search candidate name or email"
            />
          </div>
          <Button type="submit" variant="outline">
            Apply Search
          </Button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metricCards.map((card) => {
            const isActive = stageFilter === card.stage;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => handleStageFilter(card.stage)}
                className={cn(
                  'text-left bg-white p-5 rounded-2xl shadow-sm transition-all',
                  isActive ? 'border-2 border-indigo-100 bg-indigo-50/10' : 'border border-slate-200 hover:border-slate-300',
                )}
              >
                <span className={cn('text-[10px] font-bold uppercase tracking-widest', isActive ? 'text-indigo-500' : 'text-slate-400')}>
                  {card.label}
                </span>
                <p className="text-4xl font-bold text-slate-900">{card.value}</p>
              </button>
            );
          })}
        </div>

        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Applicant Name</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Exp. Level</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Technical Stack</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Location</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Stage</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((application, index) => {
                  const isLocked = recruiterPlan === PlanTier.FREE && index >= 20;
                  return (
                    <tr
                      key={application.id}
                      className={cn(
                        'group hover:bg-indigo-50/20 cursor-pointer transition-all',
                        isLocked ? 'blur pointer-events-none select-none' : '',
                      )}
                      onClick={() => openCandidateDrawer(application.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openCandidateDrawer(application.id);
                        }
                      }}
                      tabIndex={isLocked ? -1 : 0}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-xl font-bold text-lg ring-4 ring-slate-50 group-hover:ring-indigo-100 transition-all">
                            {application.candidateName
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                              {application.candidateName}
                            </p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              {application.candidateEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-700">
                          {application.candidateProfile?.primaryRole ?? 'Not provided'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5">
                          {(application.candidateProfile?.skills ?? []).slice(0, 3).map((skill) => (
                            <span
                              key={`${application.id}-${skill}`}
                              className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center text-sm font-semibold text-slate-600">
                          <MapPin className="w-4 h-4 mr-1.5 text-slate-300" />
                          {application.candidateProfile?.location ?? 'Remote'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold', getStatusPillClasses(application.status))}>
                          {getStageLabel(application.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={cn('font-extrabold text-lg leading-none', application.matchScore >= 80 ? 'text-indigo-600' : 'text-slate-900')}>
                            {application.matchScore}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{getMatchLabel(application.matchScore)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {recruiterPlan === PlanTier.FREE && applications.length > 20 ? (
            <div className="absolute inset-x-10 bottom-8 bg-white/90 rounded-2xl border border-brand-primary/20 shadow-lg p-6 text-center">
              <h3 className="text-slate-900 font-bold">Upgrade to unlock all applicants</h3>
              <p className="text-slate-500 text-sm mt-1">FREE plan shows full details for the first 20 candidates.</p>
              <Button variant="primary" className="mt-4">Upgrade Plan</Button>
            </div>
          ) : null}

          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{applications.length}</span> candidates
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                disabled={cursorHistory.length <= 1}
                onClick={goPreviousPage}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!applicationsQuery.data?.meta.hasMore}
                onClick={goNextPage}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

      <CandidateDrawer application={selectedApplication} />
    </div>
  );
}
