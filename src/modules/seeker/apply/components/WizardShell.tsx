"use client";

import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { WizardStep } from "@/constants/enums";
import { ApplyStepper } from "@/modules/seeker/apply/components/ApplyStepper";
import { useApplication } from "@/modules/seeker/apply/hooks/use-application";
import { useApplyWizard } from "@/modules/seeker/apply/hooks/use-apply-wizard";

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
  const { state, goToStep } = useApplyWizard();

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
          <StepPlaceholder label="Optimize resume" onNext={() => goToStep(WizardStep.COVER)} />
        )}
        {state.step === WizardStep.COVER && (
          <StepPlaceholder label="Cover letter" onNext={() => goToStep(WizardStep.SUBMIT)} />
        )}
        {state.step === WizardStep.SUBMIT && (
          <StepPlaceholder label="Submit" onNext={() => goToStep(WizardStep.DONE)} />
        )}
        {state.step === WizardStep.DONE && <StepPlaceholder label="Done" />}
      </div>
    </div>
  );
}

/*
 * StepPlaceholder
 * Temporary panel body — replaced by StepOptimize/StepCover/StepSubmit/StepDone
 * as each is built out later in this phase.
 */
function StepPlaceholder({ label, onNext }: { label: string; onNext?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-brand-foreground-muted">{label} step — coming next.</p>
      {onNext && (
        <Button variant="primary" size="sm" onClick={onNext}>
          Continue
        </Button>
      )}
    </div>
  );
}
