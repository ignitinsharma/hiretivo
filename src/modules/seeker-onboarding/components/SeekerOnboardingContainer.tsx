'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';
import { computeOnboardingStrength } from '@/lib/onboarding/profile-strength';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';
import { OnboardingSideRail } from './OnboardingSideRail';
import { StepWelcome } from './StepWelcome';
import { StepResume } from './StepResume';
import type {
  SeekerOnboardingStep,
  Step1Data,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

const STEP_LABELS = ['About You', 'Upload Resume'];

const TOTAL_STEPS = 2;

interface SeekerOnboardingContainerProps {
  initialStep: SeekerOnboardingStep;
  initialData: {
    userName: string;
    userEmail?: string;
    step1: Partial<Step1Data>;
    step3: {
      resume: {
        name: string;
        size: number;
        type: string;
        key: string | null;
        url: string | null;
        file: null;
      } | null;
    };
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
    initializeOnboarding,
    step1,
    step3,
  } = useSeekerOnboardingStore();

  useEffect(() => {
    initializeOnboarding({
      currentStep: initialStep,
      ...initialData,
    });
    window.localStorage.removeItem('hiretivo-seeker-onboarding');
  }, [initialData, initialStep, initializeOnboarding]);

  const handleComplete = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const strength = computeOnboardingStrength({ step1, step3 });

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
        return <StepResume onBack={previousStep} onComplete={handleComplete} />;
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
