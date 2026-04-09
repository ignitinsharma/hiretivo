'use client';

import React from 'react';
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
import { ApplicationStatus } from '@/constants/enums';
import { getStageLabel } from '@/lib/application-pipeline';
import { useUIStore } from '@/store/use-ui-store';

const STAGE_OPTIONS: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

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
  const { isCandidateDrawerOpen, closeCandidateDrawer } = useUIStore();

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
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a candidate to view details.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
