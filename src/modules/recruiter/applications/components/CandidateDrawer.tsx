"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Briefcase,
  GraduationCap,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  ThumbsUp,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InterviewTimezoneDisplay } from "@/components/shared/InterviewTimezoneDisplay";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ApplicationStatus,
  InterviewStatus,
  PlanTier,
} from "@/constants/enums";
import { getStageLabel } from "@/lib/application-pipeline";
import { useUIStore } from "@/store/use-ui-store";
import { recruiterService } from "@/services/recruiter.service";

import { useFetchAiSummary } from "@/modules/recruiter/applications/queries/use-fetch-ai-summary";
import { ScheduleInterviewModal } from "./ScheduleInterviewModal";

type TabKey = "summary" | "experience" | "education";

const TABS: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Work Experience" },
  { key: "education", label: "Education" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AiSummarySectionProps {
  isPending: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  summary: string | undefined;
  isPlanGated: boolean;
}

function AiSummarySection({
  isPending,
  isError,
  errorMessage,
  summary,
  isPlanGated,
}: AiSummarySectionProps) {
  if (isPlanGated) {
    return (
      <section className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
        <p>
          AI candidate summaries are available on PRO and ENTERPRISE plans.{" "}
          <a href="/recruiter/settings?tab=billing" className="font-semibold underline">
            Upgrade
          </a>
        </p>
      </section>
    );
  }
  if (isPending) {
    return (
      <section className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-gray-400" aria-hidden="true" />
        <span>Generating AI summary...</span>
      </section>
    );
  }
  if (isError && errorMessage !== "PLAN_GATED") return null;
  if (!summary) return null;
  return (
    <section className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm text-gray-800">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
      <p>{summary}</p>
    </section>
  );
}

const STAGE_OPTIONS: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

function formatInterviewDuration(startsAt: string, endsAt: string): string {
  const mins = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
  return `${mins} min`;
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const s = new Date(start).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
  const e = isCurrent ? "Present" : end ? new Date(end).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }) : "Present";
  return `${s} — ${e}`;
}

interface CandidateWorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  positionType: string | null;
  skills: string[];
}

interface CandidateEducation {
  id: string;
  institution: string;
  graduationDate: string | null;
  degree: string | null;
  major: string | null;
}

export interface CandidateApplication {
  id: string;
  jobId?: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string | null;
  jobTitle: string;
  matchScore: number;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  candidateProfile?: {
    primaryRole: string | null;
    headline: string | null;
    location: string | null;
    skills: string[];
    yearsExperience?: number | null;
    websiteUrl?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    twitterUrl?: string | null;
    workExperiences?: CandidateWorkExperience[];
    educations?: CandidateEducation[];
  };
  appliedAt?: string;
  updatedAt?: string;
  plan?: PlanTier;
  scheduledInterview?: {
    id: string;
    status: InterviewStatus;
    startsAt: string | null;
    endsAt: string | null;
    meetLink: string | null;
    notes: string | null;
    scheduledTimeZone?: string | null;
  } | null;
}

interface CandidateDrawerProps {
  application: CandidateApplication | null;
}

type RecruiterApplicationsResponse = {
  applications: CandidateApplication[];
  meta: {
    recruiterPlan: string;
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};

export function CandidateDrawer({ application }: CandidateDrawerProps) {
  const queryClient = useQueryClient();
  const { isCandidateDrawerOpen, closeCandidateDrawer, openScheduleModal } = useUIStore();
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const aiSummaryMutation = useFetchAiSummary();

  useEffect(() => {
    if (!isCandidateDrawerOpen || !application?.id) return;
    aiSummaryMutation.mutate(application.id);
    setActiveTab("summary");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCandidateDrawerOpen, application?.id]);

  const updateStageMutation = useMutation({
    mutationFn: async (stage: ApplicationStatus) => {
      if (!application) throw new Error("No candidate selected");
      return recruiterService.updateApplicationStage(application.id, stage);
    },
    onMutate: async (stage) => {
      if (!application) return;
      await queryClient.cancelQueries({ queryKey: ["recruiter-applications"] });
      const snapshots = queryClient.getQueriesData<RecruiterApplicationsResponse>({
        queryKey: ["recruiter-applications"],
      });
      snapshots.forEach(([queryKey, current]) => {
        if (!current) return;
        queryClient.setQueryData<RecruiterApplicationsResponse>(queryKey, {
          ...current,
          applications: current.applications.map((item) =>
            item.id === application.id ? { ...item, status: stage } : item,
          ),
        });
      });
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots?.forEach(([queryKey, snapshot]) => {
        queryClient.setQueryData(queryKey, snapshot);
      });
      toast.error(error instanceof Error ? error.message : "Failed to update stage. Try again.");
    },
    onSuccess: () => toast.success("Stage updated — email sent to candidate"),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["recruiter-application-stats"] });
    },
  });

  const cancelInterviewMutation = useMutation({
    mutationFn: async (interviewId: string) => {
      await recruiterService.cancelInterview(interviewId);
    },
    onSuccess: () => {
      toast.success("Interview cancelled — candidate notified.");
      setCancelConfirming(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel interview. Try again.");
      setCancelConfirming(false);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["recruiter-interviews-upcoming"] });
    },
  });

  const profile = application?.candidateProfile;
  const links = [
    { href: profile?.websiteUrl, Icon: Globe, label: "Website" },
    { href: profile?.linkedinUrl, Icon: Linkedin, label: "LinkedIn" },
    { href: profile?.githubUrl, Icon: Github, label: "GitHub" },
    { href: profile?.twitterUrl, Icon: Twitter, label: "Twitter" },
  ].filter((l): l is { href: string; Icon: typeof Globe; label: string } => Boolean(l.href));

  return (
    <Sheet open={isCandidateDrawerOpen} onOpenChange={closeCandidateDrawer}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:w-[640px] sm:max-w-[640px] p-0"
      >
        {application ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                  {application.candidateAvatar ? (
                    <img src={application.candidateAvatar} alt={application.candidateName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-slate-600 text-lg font-bold">{getInitials(application.candidateName)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-2xl font-bold text-slate-900 leading-tight">
                    {application.candidateName}
                  </SheetTitle>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">
                    {application.candidateEmail} · {profile?.headline ?? application.jobTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="primary" className="h-8" asChild>
                      <a href={`mailto:${application.candidateEmail}`}>
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Email
                      </a>
                    </Button>
                    {application.resumeUrl && (
                      <Button size="sm" variant="default" className="h-8" asChild>
                        <a href={application.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Stats row */}
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Score</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{application.matchScore}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {profile?.primaryRole ?? application.jobTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {profile?.location ?? "Remote"}
                    </p>
                  </div>
                  {profile?.yearsExperience != null && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Experience</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {profile.yearsExperience === 0
                          ? "< 1 Year"
                          : profile.yearsExperience === 10
                            ? "10+ Years"
                            : `${profile.yearsExperience} ${profile.yearsExperience === 1 ? "Year" : "Years"}`}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Social links */}
              {links.length > 0 && (
                <section className="flex flex-wrap gap-2">
                  {links.map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </a>
                  ))}
                </section>
              )}

              {/* AI Summary */}
              <AiSummarySection
                isPending={aiSummaryMutation.isPending}
                isError={aiSummaryMutation.isError}
                errorMessage={aiSummaryMutation.error instanceof Error ? aiSummaryMutation.error.message : undefined}
                summary={aiSummaryMutation.data?.summary}
                isPlanGated={application.plan === PlanTier.FREE}
              />

              {/* Tabs */}
              <div className="border-b border-slate-200">
                <div className="flex gap-6">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? "border-[#7560ff] text-[#7560ff]"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  {/* Skills */}
                  <section>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Skills</p>
                    {profile?.skills.length ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <span
                            key={`${application.id}-${skill}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#7560ff]/10 px-3 py-1 text-xs font-semibold text-[#7560ff]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No skills provided.</p>
                    )}
                  </section>

                  {/* Cover Letter */}
                  <section>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Cover Letter</p>
                    <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap bg-white">
                      {application.coverLetter?.trim() || "No cover letter provided."}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-4">
                  {(profile?.workExperiences?.length ?? 0) > 0 ? (
                    profile!.workExperiences!.map((exp) => (
                      <div key={exp.id} className="rounded-xl border border-slate-200 p-4 space-y-2 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{exp.title}</p>
                            <p className="text-sm text-slate-600">{exp.company}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-slate-700 line-clamp-4">{exp.description}</p>
                        )}
                        {exp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {exp.skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No work experience provided.</p>
                  )}
                </div>
              )}

              {activeTab === "education" && (
                <div className="space-y-4">
                  {(profile?.educations?.length ?? 0) > 0 ? (
                    profile!.educations!.map((edu) => (
                      <div key={edu.id} className="rounded-xl border border-slate-200 p-4 space-y-1 bg-white">
                        <p className="text-sm font-bold text-slate-900">{edu.institution}</p>
                        {(edu.degree || edu.major) && (
                          <p className="text-sm text-slate-600">
                            {[edu.degree, edu.major].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {edu.graduationDate && (
                          <p className="text-xs text-slate-400">Graduated {edu.graduationDate}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No education provided.</p>
                  )}
                </div>
              )}

              {/* Move Forward */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-900">Move Forward</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={application.status}
                    onValueChange={(value) => updateStageMutation.mutate(value as ApplicationStatus)}
                    disabled={updateStageMutation.isPending}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {getStageLabel(stage)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {/* Interview */}
              {application.status === ApplicationStatus.INTERVIEW && (
                <section className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Interview</p>
                  {(() => {
                    const interview = application.scheduledInterview;
                    const isScheduled = interview?.status === InterviewStatus.SCHEDULED;
                    const isPlanGated = application.plan === PlanTier.FREE;

                    if (!isScheduled) {
                      if (isPlanGated) {
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block w-full">
                                  <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white" disabled>
                                    Schedule Interview
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent><p>Available on Pro plan</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      }
                      return (
                        <Button variant="primary" onClick={() => openScheduleModal(application.id, null)}>
                          Schedule Interview
                        </Button>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 space-y-1.5 bg-white">
                          <InterviewTimezoneDisplay
                            startsAt={interview.startsAt}
                            scheduledTimeZone={interview.scheduledTimeZone}
                          />
                          {interview.startsAt && interview.endsAt && (
                            <p><strong>Duration:</strong> {formatInterviewDuration(interview.startsAt, interview.endsAt)}</p>
                          )}
                          <p>
                            <strong>Meet link:</strong>{" "}
                            {interview.meetLink ? (
                              <a href={interview.meetLink} target="_blank" rel="noreferrer" className="text-[#7560ff] underline">{interview.meetLink}</a>
                            ) : (
                              <span className="text-slate-400">No link provided</span>
                            )}
                          </p>
                        </div>
                        <Button variant="default" className="w-full" onClick={() => openScheduleModal(application.id, interview.id)}>
                          Reschedule
                        </Button>
                        {!cancelConfirming ? (
                          <Button
                            variant="default"
                            className="w-full text-destructive border-destructive hover:bg-destructive/5"
                            onClick={() => setCancelConfirming(true)}
                          >
                            Cancel Interview
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              className="flex-1"
                              disabled={cancelInterviewMutation.isPending}
                              onClick={() => cancelInterviewMutation.mutate(interview.id)}
                            >
                              Confirm cancellation?
                            </Button>
                            <Button variant="ghost" onClick={() => setCancelConfirming(false)}>Never mind</Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </section>
              )}
            </div>

            {application && (
              <ScheduleInterviewModal
                applicationId={application.id}
                existingInterview={
                  application.scheduledInterview?.status === InterviewStatus.SCHEDULED
                    ? {
                        id: application.scheduledInterview.id,
                        startsAt: new Date(application.scheduledInterview.startsAt!),
                        endsAt: new Date(application.scheduledInterview.endsAt!),
                        meetLink: application.scheduledInterview.meetLink,
                        notes: application.scheduledInterview.notes,
                        scheduledTimeZone: application.scheduledInterview.scheduledTimeZone,
                      }
                    : null
                }
                onSuccess={async () => {
                  await queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] });
                  await queryClient.invalidateQueries({ queryKey: ["recruiter-interviews-upcoming"] });
                }}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 p-6">Select a candidate to view details.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
