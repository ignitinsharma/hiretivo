"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { WizardStep } from "@/constants/enums";
import { computeKeywordStats } from "@/lib/apply/keyword-match";
import { seekerService } from "@/services/seeker.service";
import { ApplyStepper } from "@/modules/seeker/apply/components/ApplyStepper";
import { StepOptimize } from "@/modules/seeker/apply/components/StepOptimize";
import { StepCover } from "@/modules/seeker/apply/components/StepCover";
import { StepSubmit } from "@/modules/seeker/apply/components/StepSubmit";
import { StepDone } from "@/modules/seeker/apply/components/StepDone";
import { useApplication } from "@/modules/seeker/apply/hooks/use-application";
import { useApplyWizard } from "@/modules/seeker/apply/hooks/use-apply-wizard";
import type { SubmittedFormField } from "@/modules/seeker/apply/types/apply.types";

interface WizardShellProps {
  applicationId: string;
}

/*
 * WizardShell
 * Client orchestrator for the apply wizard: loads the target Application,
 * renders the stepper, and dispatches to the active step's panel. Handles
 * isLoading / isError / not-found before any step renders.
 * @param applicationId - id from the wizard route
 */
export function WizardShell({ applicationId }: WizardShellProps) {
  const { data, isLoading, isError, refetch } = useApplication(applicationId);
  const { state, goToStep, setResume, setCoverLetter, setReservationHandle } = useApplyWizard();
  const [tailoredResumeUrl, setTailoredResumeUrl] = useState<string | null>(null);
  const [submittedFormData, setSubmittedFormData] = useState<SubmittedFormField[] | null>(null);

  // Re-opening an already-finalized application jumps straight to Done
  // instead of restarting the wizard at Optimize.
  useEffect(() => {
    if (data?.tailoredResumeKey && state.step === WizardStep.OPTIMIZE) {
      setTailoredResumeUrl(data.tailoredResumeUrl);
      setSubmittedFormData(data.submittedFormData);
      setCoverLetter(data.coverLetter ?? "");
      goToStep(WizardStep.DONE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.tailoredResumeKey]);

  if (isLoading) {
    return <PageSkeleton lines={6} />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-brand-foreground-muted">Couldn&apos;t load this application.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // No dedicated schema field holds the in-progress ResumeDocument draft
  // (DATA-MODEL only stores tailoredResumeKey, set at finalize) — the
  // computed keywordStats is the one real, persistable artifact this step
  // produces early, so that's what gets saved on advance.
  const handleOptimizeNext = async () => {
    if (state.resume) {
      const seekerSkillNames = state.resume.skillGroups.flatMap((g) => g.skills);
      const { stats } = computeKeywordStats(data.requiredSkills, data.preferredSkills, seekerSkillNames);
      await seekerService.updateApplication(applicationId, { keywordStats: stats }).catch(() => {});
    }
    goToStep(WizardStep.COVER);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-foreground tracking-tight md:text-3xl">
          {data.jobTitle}
        </h1>
        <p className="mt-1 text-base text-brand-foreground-muted">{data.companyName}</p>
      </div>

      <ApplyStepper step={state.step} />

      <div className="rounded-xl border border-brand-border bg-white p-6">
        {state.step === WizardStep.OPTIMIZE && (
          <StepOptimize
            application={data}
            resume={state.resume}
            onOptimized={(resume, reservationHandle) => {
              setResume(resume);
              setReservationHandle(reservationHandle);
            }}
            onResumeChange={setResume}
            onNext={handleOptimizeNext}
          />
        )}
        {state.step === WizardStep.COVER && (
          <StepCover
            application={data}
            coverLetter={state.coverLetter}
            reservationHandle={state.reservationHandle}
            onGenerated={setCoverLetter}
            onReservationConsumed={() => setReservationHandle(null)}
            onNext={() => goToStep(WizardStep.SUBMIT)}
          />
        )}
        {state.step === WizardStep.SUBMIT && state.resume && (
          <StepSubmit
            application={data}
            resume={state.resume}
            coverLetter={state.coverLetter}
            onFinalized={(url, rows) => {
              setTailoredResumeUrl(url);
              setSubmittedFormData(rows);
              goToStep(WizardStep.DONE);
            }}
          />
        )}
        {state.step === WizardStep.DONE && (
          <StepDone
            application={{ ...data, submittedFormData }}
            tailoredResumeUrl={tailoredResumeUrl}
            coverLetter={state.coverLetter}
          />
        )}
      </div>
    </div>
  );
}
