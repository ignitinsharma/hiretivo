'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { completeSeekerOnboarding } from '@/app/actions/onboarding/seeker';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';
import { computeOnboardingStrength } from '@/lib/onboarding/profile-strength';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';
import { OnboardingSideRail } from './OnboardingSideRail';
import { StepWelcome } from './StepWelcome';
import { StepSkills } from './StepSkills';
import { StepProofOfWork } from './StepProofOfWork';
import { StepExperience } from './StepExperience';
import { StepCompensation } from './StepCompensation';
import { StepReviewSubmit } from './StepReviewSubmit';
import type {
  SeekerOnboardingStep,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  ProofOfWorkData,
  ExperienceData,
  CompensationData,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

/*
 * SeekerOnboardingContainer
 * Root client component for the 6-step verified-engineer onboarding flow.
 * Manages step transitions, progress bar, side rail strength computation,
 * and the final completeSeekerOnboarding server action.
 */

const STEP_LABELS = [
  'About You',
  'Skills',
  'Proof of Work',
  'Experience',
  'Compensation',
  'Review & Submit',
];

const TOTAL_STEPS = 6;

interface SeekerOnboardingContainerProps {
  initialStep: SeekerOnboardingStep;
  initialData: {
    userName: string;
    step1: Partial<Step1Data>;
    step2: Partial<Step2Data>;
    step3: Partial<Step3Data>;
    step4: Partial<Step4Data>;
    proofOfWork?: Partial<ProofOfWorkData>;
    experience?: Partial<ExperienceData>;
    compensation?: Partial<CompensationData>;
  };
}

export function SeekerOnboardingContainer({
  initialStep,
  initialData,
}: SeekerOnboardingContainerProps) {
  const router = useRouter();
  const {
    currentStep,
    nextStep,
    previousStep,
    setCurrentStep,
    initializeOnboarding,
    step1,
    step2,
    proofOfWork,
    experience,
    compensation,
  } = useSeekerOnboardingStore();

  useEffect(() => {
    initializeOnboarding({
      currentStep: initialStep,
      ...initialData,
    });
    window.localStorage.removeItem('hiretivo-seeker-onboarding');
  }, [initialData, initialStep, initializeOnboarding]);

  /*
   * handleComplete
   * Triggers the completeSeekerOnboarding server action.
   * On success: redirects to the returned URL.
   * On failure: snaps back to the missing step.
   */
  const handleComplete = async () => {
    const result = await completeSeekerOnboarding();

    if (!result.success) {
      console.error(
        '[SeekerOnboardingContainer] completeSeekerOnboarding failed:',
        result.error,
      );
      setCurrentStep(result.missingStep);
      return;
    }

    router.push(result.redirectTo);
    router.refresh();
  };

  /* Compute live profile strength for the side rail */
  const strength = computeOnboardingStrength({
    step1,
    step2,
    proofOfWork,
    experience,
    compensation,
  });

  /* Clamp step to valid SeekerOnboardingStep range (1–6) for the side rail */
  const sideRailStep = Math.min(
    Math.max(currentStep, 1),
    TOTAL_STEPS,
  ) as SeekerOnboardingStep;

  const showProgress = currentStep <= TOTAL_STEPS;
  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepWelcome onNext={nextStep} />;
      case 2:
        return <StepSkills onNext={nextStep} onBack={previousStep} />;
      case 3:
        return <StepProofOfWork onNext={nextStep} onBack={previousStep} />;
      case 4:
        return <StepExperience onNext={nextStep} onBack={previousStep} />;
      case 5:
        return <StepCompensation onNext={nextStep} onBack={previousStep} />;
      case 6:
        return (
          <StepReviewSubmit onBack={previousStep} onComplete={handleComplete} />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingShell
      sideRail={<OnboardingSideRail strength={strength} step={sideRailStep} />}
    >
      {showProgress && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-brand-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
            <p className="text-sm text-brand-foreground-muted">
              {Math.round(progressPercent)}% Complete
            </p>
          </div>
          <div className="flex gap-1.5">
            {STEP_LABELS.map((label, index) => (
              <div
                key={label}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  index + 1 <= currentStep ? 'bg-brand-primary' : 'bg-brand-surface',
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 overflow-hidden">
            {STEP_LABELS.map((label, index) => (
              <p
                key={label}
                className={cn(
                  'text-xs truncate',
                  index + 1 <= currentStep
                    ? 'text-brand-primary font-medium'
                    : 'text-brand-foreground-muted',
                )}
                style={{ maxWidth: `${100 / STEP_LABELS.length}%` }}
              >
                {label}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="animate-in fade-in duration-300">{renderStep()}</div>
    </OnboardingShell>
  );
}
