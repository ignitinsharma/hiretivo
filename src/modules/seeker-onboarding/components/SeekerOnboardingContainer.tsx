'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  completeSeekerOnboarding,
  skipSeekerResumeOnboarding,
} from '@/app/actions/onboarding/seeker';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';
import { StepWelcome } from './StepWelcome';
import { StepSkills } from './StepSkills';
import { StepResume } from './StepResume';
import { StepPreferences } from './StepPreferences';
import { StepSeekerComplete } from './StepSeekerComplete';
import type {
  SeekerOnboardingStep,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

const STEP_LABELS = ['Welcome', 'Skills', 'Resume', 'Preferences', 'Complete'];

interface SeekerOnboardingContainerProps {
  initialStep: SeekerOnboardingStep;
  initialData: {
    userName: string;
    step1: Partial<Step1Data>;
    step2: Partial<Step2Data>;
    step3: Partial<Step3Data>;
    step4: Partial<Step4Data>;
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
  } = useSeekerOnboardingStore();

  const progressPercent = ((currentStep - 1) / 4) * 100;

  useEffect(() => {
    initializeOnboarding({
      currentStep: initialStep,
      ...initialData,
    });
    window.localStorage.removeItem('hiretivo-seeker-onboarding');
  }, [initialData, initialStep, initializeOnboarding]);

  const handleSkipResume = async () => {
    const result = await skipSeekerResumeOnboarding();
    if (!result.success) {
      console.error("[SeekerOnboardingContainer] skipSeekerResumeOnboarding failed:", result.error);
      return;
    }
    setCurrentStep(4);
  };

  const handleComplete = async () => {
    const result = await completeSeekerOnboarding();

    if (!result.success) {
      console.error("[SeekerOnboardingContainer] completeSeekerOnboarding failed:", result.error);
      setCurrentStep(result.missingStep);
      return result;
    }

    router.push(result.redirectTo);
    router.refresh();
    return result;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepWelcome
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <StepSkills
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      case 3:
        return (
          <StepResume
            onNext={nextStep}
            onBack={previousStep}
            onSkip={handleSkipResume}
          />
        );
      case 4:
        return (
          <StepPreferences
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      case 5:
        return <StepSeekerComplete onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingShell>
      {currentStep < 5 && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Step {currentStep} of 5
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.round(progressPercent)}% Complete
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEP_LABELS.map((label, index) => (
              <p
                key={label}
                className={cn(
                  'text-xs',
                  index + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
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
