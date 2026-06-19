"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  UserCheck,
  Users,
  Inbox,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStatus, JobStatus, PlanTier, VerificationStatus } from "@/constants/enums";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { getStageLabel } from "@/lib/application-pipeline";
import {
  CandidateDrawer,
  type CandidateApplication,
} from "@/modules/recruiter/applications/components/CandidateDrawer";
import { useUIStore } from "@/store/use-ui-store";
import { recruiterService } from "@/services/recruiter.service";

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

const MAX_TABLE_SKILLS = 2;

async function fetchRecruiterStats(
  jobId?: string,
): Promise<RecruiterStatsResponse> {
  return recruiterService.getApplicationStats(jobId);
}

async function fetchRecruiterApplications(
  cursor: string | null,
  stage: ApplicationStatus | null,
  search: string,
  jobId?: string,
): Promise<RecruiterApplicationsResponse> {
  return recruiterService.getApplications({
    cursor,
    stage,
    search,
    jobId,
    limit: 25,
  });
}

function getMatchLabel(score: number): string {
  if (score >= 90) return "Expert Match";
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  return "Partial Match";
}

function getVisibleSkills(skills: string[]): {
  visible: string[];
  hiddenCount: number;
} {
  return {
    visible: skills.slice(0, MAX_TABLE_SKILLS),
    hiddenCount: Math.max(skills.length - MAX_TABLE_SKILLS, 0),
  };
}

function getStatusPillClasses(status: ApplicationStatus): string {
  switch (status) {
    case ApplicationStatus.APPLIED:
      return "bg-slate-100 text-slate-700";
    case ApplicationStatus.REVIEWING:
      return "bg-blue-100 text-blue-700";
    case ApplicationStatus.INTERVIEW:
      return "bg-primary/10 text-primary";
    case ApplicationStatus.OFFER:
      return "bg-amber-100 text-amber-700";
    case ApplicationStatus.HIRED:
      return "bg-gray-100 text-black";
    case ApplicationStatus.REJECTED:
      return "bg-red-100 text-red-700";
    default:
      return "";
  }
}

function Sparkline({ isPrimary }: { isPrimary: boolean }) {
  const strokeColor = isPrimary ? "rgba(255,255,255,0.65)" : "currentColor";
  return (
    <svg className="h-8 w-20" viewBox="0 0 80 32" fill="none">
      <path
        d="M2 24 C8 24, 12 16, 20 18 C28 20, 32 26, 40 22 C48 18, 52 10, 60 12 C68 14, 72 8, 78 6"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RecruiterApplicationsPage() {
  const [stageFilter, setStageFilter] = useState<ApplicationStatus | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([
    null,
  ]);

  const { openCandidateDrawer, selectedApplicationId } = useUIStore();

  const statsQuery = useQuery({
    queryKey: ["recruiter-application-stats"],
    queryFn: () => fetchRecruiterStats(undefined),
    staleTime: 5 * 60_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["recruiter-applications", stageFilter, search, cursor],
    queryFn: () =>
      fetchRecruiterApplications(cursor, stageFilter, search, undefined),
    staleTime: 30_000,
  });

  const applications = applicationsQuery.data?.applications ?? [];
  const selectedApplication =
    applications.find((app) => app.id === selectedApplicationId) ?? null;
  const recruiterPlan =
    applicationsQuery.data?.meta.recruiterPlan ?? PlanTier.FREE;

  const activeJobsQuery = useQuery({
    queryKey: ["recruiter-active-jobs"],
    queryFn: () => recruiterService.getActiveJobs(),
    staleTime: 5 * 60_000,
  });

  const hasActiveJobs =
    (activeJobsQuery.data ?? []).filter((j) => j.status === JobStatus.OPEN).length > 0;

  const metricCards = useMemo(
    () => [
      {
        label: "Total",
        value: statsQuery.data?.total ?? 0,
        stage: null as ApplicationStatus | null,
        variant: "primary" as const,
        icon: <Users className="h-5 w-5" />,
      },
      {
        label: "Applied",
        value: statsQuery.data?.applied ?? 0,
        stage: ApplicationStatus.APPLIED,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        label: "Reviewing",
        value: statsQuery.data?.reviewing ?? 0,
        stage: ApplicationStatus.REVIEWING,
        icon: <Briefcase className="h-5 w-5" />,
      },
      {
        label: "Interview",
        value: statsQuery.data?.interview ?? 0,
        stage: ApplicationStatus.INTERVIEW,
        icon: <Calendar className="h-5 w-5" />,
      },
      {
        label: "Hired",
        value: statsQuery.data?.hired ?? 0,
        stage: ApplicationStatus.HIRED,
        icon: <UserCheck className="h-5 w-5" />,
      },
    ],
    [statsQuery.data],
  );

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
        <Button type="submit" variant="primary">
          Apply Search
        </Button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[170px] p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between"
              >
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))
          : metricCards.map((card) => {
          const isActive = stageFilter === card.stage;
          const isPrimary = card.variant === "primary";
          const showSparkline = card.value > 0;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => handleStageFilter(card.stage)}
              className={cn(
                "min-h-[170px] text-left p-5 rounded-xl transition-all flex flex-col justify-between",
                isPrimary
                  ? "bg-linear-to-br from-primary to-primary/80 text-white border border-transparent"
                  : isActive
                    ? "bg-white border-2 border-gray-100"
                    : "bg-white border border-slate-200 hover:border-slate-300",
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isPrimary
                      ? "bg-white/20 text-white"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {card.icon}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPrimary
                      ? "text-white/80"
                      : isActive
                        ? "text-gray-500"
                        : "text-slate-600",
                  )}
                >
                  {card.label}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <p
                  className={cn(
                    "text-4xl font-bold",
                    isPrimary ? "text-white" : "text-slate-900",
                  )}
                >
                  {card.value}
                </p>
                {showSparkline ? (
                  <span className={cn(isPrimary ? "text-white" : "text-slate-400")}>
                    <Sparkline isPrimary={isPrimary} />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
        {applicationsQuery.isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Applicant Name
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Exp. Level
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Technical Stack
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Location
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Stage
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-8 py-6">
                      <div className="flex gap-1.5">
                        <Skeleton className="h-6 w-14 rounded" />
                        <Skeleton className="h-6 w-14 rounded" />
                        <Skeleton className="h-6 w-14 rounded" />
                      </div>
                    </td>
                    <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-8 py-6 text-right"><Skeleton className="h-7 w-12 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            {activeJobsQuery.isLoading ? (
              <div className="space-y-4 text-center">
                <Skeleton className="h-16 w-16 rounded-xl mx-auto" />
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-4 w-72 mx-auto" />
              </div>
            ) : hasActiveJobs ? (
              <>
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                  <Inbox className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No applications yet</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md text-center leading-relaxed">
                  Your job is live and visible to job seekers. Applications will appear here once candidates start applying. Share your job link to attract more applicants.
                </p>
                {activeJobsQuery.data && activeJobsQuery.data.length > 0 ? (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        const jobId = activeJobsQuery.data![0].id;
                        navigator.clipboard.writeText(`${window.location.origin}/jobs/${jobId}`);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Copy Job Link
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                  <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No jobs posted yet</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md text-center leading-relaxed">
                  Post your first job to start receiving applications from skilled candidates.
                </p>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => useUIStore.getState().openPostJobModal()}
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Job
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Applicant Name
                    </th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Exp. Level
                    </th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Technical Stack
                    </th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Location
                    </th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Stage
                    </th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">
                      Match
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((application) => {
                  const isLocked = application.locked === true;
                  const { visible, hiddenCount } = getVisibleSkills(
                    application.candidateProfile?.skills ?? [],
                  );

                  return (
                    <tr
                      key={application.id}
                      className={cn(
                        "group hover:bg-gray-50/20 cursor-pointer transition-all",
                        isLocked ? "blur pointer-events-none select-none" : "",
                      )}
                      onClick={() => openCandidateDrawer(application.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openCandidateDrawer(application.id);
                        }
                      }}
                      tabIndex={isLocked ? -1 : 0}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <InitialsAvatar
                            name={application.candidateName}
                            email={application.candidateEmail}
                            userId={application.candidateId}
                            image={application.candidateAvatar}
                            size="lg"
                            verified={
                              application.verificationStatus ===
                              VerificationStatus.VERIFIED
                            }
                            className="shrink-0"
                          />
                          <div>
                            <p className="font-semibold capitalize text-slate-900 text-lg group-hover:text-gray-600 transition-colors">
                              {application.candidateName}
                            </p>
                            <p className="text-xs user-section text-slate-400 font-bold tracking-wider">
                              {application.candidateEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-700">
                          {application.candidateProfile?.primaryRole ??
                            "Not provided"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5">
                          {visible.map((skill) => (
                            <span
                              key={`${application.id}-${skill}`}
                              className="px-2.5 py-1 bg-[#7560ff]/10 text-[#7560ff] text-[10px] font-bold rounded uppercase"
                            >
                              {skill}
                            </span>
                          ))}
                          {hiddenCount > 0 ? (
                            <span className="px-2.5 py-1 bg-gray-50 text-slate-500 text-[10px] font-bold rounded uppercase border border-slate-100">
                              +{hiddenCount} more
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center text-sm font-semibold text-slate-600">
                          <MapPin className="w-4 h-4 mr-1.5 text-slate-300" />
                          {application.candidateProfile?.location ?? "Location not provided"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                            getStatusPillClasses(application.status),
                          )}
                        >
                          {getStageLabel(application.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span
                            className={cn(
                              "font-bold text-lg leading-none",
                              application.matchScore >= 80
                                ? "text-gray-600"
                                : "text-slate-900",
                            )}
                          >
                            {application.matchScore}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {getMatchLabel(application.matchScore)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            {recruiterPlan === PlanTier.FREE &&
            applications.some((app) => app.locked) ? (
              <div className="absolute inset-x-10 bottom-8 bg-white/90 rounded-xl border border-gray-200 p-6 text-center">
                <h3 className="text-slate-900 font-bold">
                  Upgrade to unlock all applicants
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  FREE plan shows full details for the first 5 candidates per job.
                </p>
                <Button variant="primary" className="mt-4">
                  Upgrade Plan
                </Button>
              </div>
            ) : null}

            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Showing{" "}
                <span className="text-slate-900">{applications.length}</span>{" "}
                candidates
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="default"
                  size="icon"
                  disabled={cursorHistory.length <= 1}
                  onClick={goPreviousPage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  disabled={!applicationsQuery.data?.meta.hasMore}
                  onClick={goNextPage}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <CandidateDrawer application={selectedApplication} />
    </div>
  );
}
