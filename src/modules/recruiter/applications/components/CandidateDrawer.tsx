"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

import { ScheduleInterviewModal } from "@/modules/recruiter/applications/components/ScheduleInterviewModal";
import { useFetchAiSummary } from "@/modules/recruiter/applications/queries/use-fetch-ai-summary";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ApplicationStatus, InterviewStatus, PlanTier } from "@/constants/enums";
import { recruiterService, type FitLevel } from "@/services/recruiter.service";
import { useUIStore } from "@/store/use-ui-store";
import { formatRelativeTime } from "@/lib/utils";

import { DrawerHeader } from "./candidate-drawer/sections/DrawerHeader";
import { AiInsightsCard } from "./candidate-drawer/sections/AiInsightsCard";
import { SidebarPanel } from "./candidate-drawer/sections/SidebarPanel";
import { SkillsMatchCard } from "./candidate-drawer/sections/SkillsMatchCard";
import { ProfileTabs } from "./candidate-drawer/sections/ProfileTabs";
import { TabContentSummary } from "./candidate-drawer/sections/TabContentSummary";
import { TabContentExperience } from "./candidate-drawer/sections/TabContentExperience";
import { TabContentEducation } from "./candidate-drawer/sections/TabContentEducation";
import type { AiState, CandidateApplication, TabKey } from "./candidate-drawer/types";
import { calculateProfileStrength, getSkillsBreakdown } from "./candidate-drawer/utils";

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

export type { CandidateApplication } from "./candidate-drawer/types";

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
      toast.error(
        error instanceof Error ? error.message : "Failed to update stage. Try again.",
      );
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
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel interview. Try again.",
      );
      setCancelConfirming(false);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["recruiter-interviews-upcoming"] });
    },
  });

  if (!application) {
    return (
      <Sheet open={isCandidateDrawerOpen} onOpenChange={closeCandidateDrawer}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-6xl">
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-surface">
              <FileText className="h-8 w-8 text-brand-foreground-secondary" />
            </div>
            <p className="text-sm text-brand-foreground-muted">Select a candidate to view their details.</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const profile = application.candidateProfile;
  const candidateSkills = profile?.skills ?? [];
  const { matchedSkills, missingSkills } = getSkillsBreakdown(
    application.jobSkills ?? [],
    candidateSkills,
  );
  const profileStrength = calculateProfileStrength(profile);

  const aiState: AiState = {
    isPending: aiSummaryMutation.isPending,
    isError: aiSummaryMutation.isError,
    errorMessage:
      aiSummaryMutation.error instanceof Error ? aiSummaryMutation.error.message : undefined,
    summary: aiSummaryMutation.data?.summary,
    fitScore: aiSummaryMutation.data?.fitScore,
    fitLevel: aiSummaryMutation.data?.fitLevel as FitLevel | undefined,
    isPlanGated: application.plan === PlanTier.FREE,
  };

  return (
    <Sheet open={isCandidateDrawerOpen} onOpenChange={closeCandidateDrawer}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-6xl">
        <div className="h-full overflow-y-auto bg-white p-4 md:p-6">
          <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-4">
              <DrawerHeader application={application} />
              <SidebarPanel
                application={application}
                profileStrength={profileStrength}
                onStageChange={(value) => updateStageMutation.mutate(value)}
                isUpdatingStage={updateStageMutation.isPending}
                cancelConfirming={cancelConfirming}
                isCancellingInterview={cancelInterviewMutation.isPending}
                onStartCancelInterview={() => setCancelConfirming(true)}
                onAbortCancelInterview={() => setCancelConfirming(false)}
                onConfirmCancelInterview={(interviewId) =>
                  cancelInterviewMutation.mutate(interviewId)
                }
                onScheduleInterview={(applicationId, interviewId) =>
                  openScheduleModal(applicationId, interviewId)
                }
              />
            </div>

            <section className="space-y-4">
              <div className="flex justify-start">
                {application.appliedAt ? (
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-sm font-medium text-brand-foreground-muted">
                    <Calendar className="h-4 w-4" />
                    {formatRelativeTime(application.appliedAt)}
                  </p>
                ) : null}
              </div>

              <AiInsightsCard state={aiState} />

              <SkillsMatchCard
                matchedSkills={matchedSkills}
                missingSkills={missingSkills}
                totalSkills={application.jobSkills.length}
                applicationId={application.id}
              />

              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === "summary" ? <TabContentSummary application={application} /> : null}
              {activeTab === "experience" ? (
                <TabContentExperience experiences={profile?.workExperiences} />
              ) : null}
              {activeTab === "education" ? (
                <TabContentEducation educations={profile?.educations} />
              ) : null}
            </section>
          </div>

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
        </div>
      </SheetContent>
    </Sheet>
  );
}
