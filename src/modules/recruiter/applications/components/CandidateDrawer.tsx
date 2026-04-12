'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ApplicationStatus, InterviewStatus, PlanTier } from '@/constants/enums';
import { getStageLabel } from '@/lib/application-pipeline';
import { useUIStore } from '@/store/use-ui-store';

import { ScheduleInterviewModal } from './ScheduleInterviewModal';

const STAGE_OPTIONS: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

// Helper functions — at module level, outside component
function formatInterviewDate(isoString: string): string {
  return new Date(isoString).toUTCString().replace(' GMT', ' UTC');
}

function formatInterviewDuration(startsAt: string, endsAt: string): string {
  const mins = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000);
  return `${mins} min`;
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
  };
  appliedAt?: string;
  updatedAt?: string;
  plan?: PlanTier;
  scheduledInterview?: {
    id: string;
    status: InterviewStatus;
    startsAt: string | null;    // ISO string (from API)
    endsAt: string | null;
    meetLink: string | null;
    notes: string | null;
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

  const updateStageMutation = useMutation({
    mutationFn: async (stage: ApplicationStatus) => {
      if (!application) {
        throw new Error('No candidate selected');
      }

      const response = await fetch(`/api/recruiter/applications/${application.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? 'Failed to update stage');
      }

      return data as { status: ApplicationStatus; updatedAt: string };
    },
    onMutate: async (stage) => {
      if (!application) {
        return;
      }

      await queryClient.cancelQueries({ queryKey: ['recruiter-applications'] });
      const snapshots = queryClient.getQueriesData<RecruiterApplicationsResponse>({
        queryKey: ['recruiter-applications'],
      });

      snapshots.forEach(([queryKey, current]) => {
        if (!current) {
          return;
        }
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
      toast.error(error instanceof Error ? error.message : 'Failed to update stage. Try again.');
    },
    onSuccess: () => {
      toast.success('Stage updated — email sent to candidate');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recruiter-applications'] });
      await queryClient.invalidateQueries({ queryKey: ['recruiter-application-stats'] });
    },
  });

  const cancelInterviewMutation = useMutation({
    mutationFn: async (interviewId: string) => {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/cancel`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to cancel');
      return data;
    },
    onSuccess: () => {
      toast.success('Interview cancelled — candidate notified.');
      setCancelConfirming(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel interview. Try again.');
      setCancelConfirming(false);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recruiter-applications'] });
      await queryClient.invalidateQueries({ queryKey: ['recruiter-interviews-upcoming'] });
    },
  });

  return (
    <Sheet open={isCandidateDrawerOpen} onOpenChange={closeCandidateDrawer}>
      <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto">
        {application ? (
          <div className="space-y-6 pr-2">
            <SheetHeader>
              <SheetTitle className="text-4xl font-bold text-slate-900">{application.candidateName}</SheetTitle>
              <SheetDescription className="text-slate-500">
                {application.candidateEmail} · {application.jobTitle}
              </SheetDescription>
            </SheetHeader>

            <section className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Stage</p>
              <Select
                value={application.status}
                onValueChange={(value) => updateStageMutation.mutate(value as ApplicationStatus)}
                disabled={updateStageMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {getStageLabel(stage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cover Letter</p>
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                {application.coverLetter?.trim() || 'No cover letter provided.'}
              </div>
            </section>

            {application.resumeUrl ? (
              <section className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Resume</p>
                <Button asChild className="w-full sm:w-auto">
                  <a href={application.resumeUrl} target="_blank" rel="noreferrer">
                    View Resume
                  </a>
                </Button>
              </section>
            ) : null}

            {application.status === ApplicationStatus.INTERVIEW && (
              <section className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Interview</p>
                <Separator />

                {(() => {
                  const interview = application.scheduledInterview;
                  const isScheduled = interview?.status === InterviewStatus.SCHEDULED;
                  // D-07: PlanTier.FREE is the only non-paid tier — no STARTER enum value exists
                  const isPlanGated = application.plan === PlanTier.FREE;

                  // No interview or last interview was cancelled/completed → show schedule button
                  if (!isScheduled) {
                    if (isPlanGated) {
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block w-full">
                                <Button
                                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white"
                                  disabled
                                  aria-disabled="true"
                                >
                                  Schedule Interview
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Available on Pro plan</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }
                    return (
                      <Button
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white"
                        onClick={() => openScheduleModal(application.id, null)}
                      >
                        Schedule Interview
                      </Button>
                    );
                  }

                  // Interview exists with SCHEDULED status → show details + reschedule + cancel
                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 space-y-1.5">
                        <p><strong>Date:</strong> {formatInterviewDate(interview.startsAt!)}</p>
                        {interview.startsAt && interview.endsAt && (
                          <p><strong>Duration:</strong> {formatInterviewDuration(interview.startsAt, interview.endsAt)}</p>
                        )}
                        <p>
                          <strong>Meet link:</strong>{' '}
                          {interview.meetLink
                            ? <a href={interview.meetLink} target="_blank" rel="noreferrer" className="text-brand-primary underline">{interview.meetLink}</a>
                            : <span className="text-slate-400">No link provided</span>
                          }
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => openScheduleModal(application.id, interview.id)}
                      >
                        Reschedule
                      </Button>

                      {!cancelConfirming ? (
                        <Button
                          variant="outline"
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
                            aria-label="Confirm interview cancellation"
                          >
                            Confirm cancellation?
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setCancelConfirming(false)}
                            aria-label="Keep interview"
                          >
                            Never mind
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a candidate to view details.</p>
        )}

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
                  }
                : null
            }
            onSuccess={async () => {
              await queryClient.invalidateQueries({ queryKey: ['recruiter-applications'] });
              await queryClient.invalidateQueries({ queryKey: ['recruiter-interviews-upcoming'] });
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
