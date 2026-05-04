'use client';

import { useEffect } from 'react';

import { completeSeekerOnboarding } from '@/app/actions/onboarding/seeker';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';
import { StepWelcome } from './StepWelcome';
import { StepSkills } from './StepSkills';
import { StepResume } from './StepResume';
import { StepPreferences } from './StepPreferences';
import { StepSeekerComplete } from './StepSeekerComplete';
import type { SeekerOnboardingStep } from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

const STEP_LABELS = ['Welcome', 'Skills', 'Resume', 'Preferences', 'Complete'];

interface SeekerOnboardingContainerProps {
  initialStep: SeekerOnboardingStep;
}

export function SeekerOnboardingContainer({ initialStep }: SeekerOnboardingContainerProps) {
  const {
    currentStep,
    nextStep,
    previousStep,
    setCurrentStep,
  } = useSeekerOnboardingStore();

  const progressPercent = ((currentStep - 1) / 4) * 100;

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep, setCurrentStep]);

  const handleComplete = async () => {
    const result = await completeSeekerOnboarding();
    console.error("[SeekerOnboardingContainer] completeSeekerOnboarding failed:", result.error);
    setCurrentStep(result.missingStep);
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
            onSkip={() => nextStep()}
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
