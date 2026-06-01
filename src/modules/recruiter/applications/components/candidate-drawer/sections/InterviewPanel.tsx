import { Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InterviewTimezoneDisplay } from "@/components/shared/InterviewTimezoneDisplay";
import { ApplicationStatus, InterviewStatus } from "@/constants/enums";
import { useUIStore } from "@/store/use-ui-store";

import type { CandidateApplication } from "../types";
import { formatInterviewDuration } from "../utils";

interface InterviewPanelProps {
  application: CandidateApplication;
  cancelConfirming: boolean;
  isCancelling: boolean;
  onStartCancel: () => void;
  onAbortCancel: () => void;
  onConfirmCancel: (interviewId: string) => void;
  onSchedule: (applicationId: string, interviewId?: string | null) => void;
}

export function InterviewPanel({
  application,
  cancelConfirming,
  isCancelling,
  onStartCancel,
  onAbortCancel,
  onConfirmCancel,
  onSchedule,
}: InterviewPanelProps) {
  const { openPaidFeatureModal } = useUIStore();
  if (application.status !== ApplicationStatus.INTERVIEW) return null;

  const interview = application.scheduledInterview;
  const isScheduled = interview?.status === InterviewStatus.SCHEDULED;
  const shouldShowUpgrade = application.canScheduleInterviews === false;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-4">
      <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-foreground-muted">
        <Video className="h-4 w-4" />
        Interview
      </p>

      {!isScheduled ? (
        shouldShowUpgrade ? (
          <Button
            className="w-full"
            onClick={() =>
              openPaidFeatureModal({
                feature: "interview_scheduling",
                title: "Schedule Interviews",
                description: "Schedule interviews and email applicants directly from your dashboard.",
              })
            }
          >
            Schedule Interview
          </Button>
        ) : (
          <Button className="w-full" onClick={() => onSchedule(application.id, null)}>
            Schedule Interview
          </Button>
        )
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-brand-border bg-brand-surface p-3">
            <InterviewTimezoneDisplay
              startsAt={interview.startsAt}
              scheduledTimeZone={interview.scheduledTimeZone}
            />
            {interview.startsAt && interview.endsAt ? (
              <p className="mt-1 text-xs text-brand-foreground-muted">
                <span className="font-medium">Duration:</span>{" "}
                {formatInterviewDuration(interview.startsAt, interview.endsAt)}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-brand-foreground-muted">
              <span className="font-medium">Meet link:</span>{" "}
              {interview.meetLink ? (
                <a href={interview.meetLink} target="_blank" rel="noreferrer" className="text-brand-primary underline">
                  Join Meeting
                </a>
              ) : (
                "Not provided"
              )}
            </p>
          </div>

          <Button variant="secondary" className="w-full" onClick={() => onSchedule(application.id, interview.id)}>
            Reschedule
          </Button>

          {!cancelConfirming ? (
            <Button variant="ghost" className="w-full text-brand-danger hover:bg-red-50" onClick={onStartCancel}>
              Cancel Interview
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={isCancelling}
                onClick={() => onConfirmCancel(interview.id)}
              >
                Confirm?
              </Button>
              <Button variant="secondary" size="sm" onClick={onAbortCancel}>
                Never mind
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
