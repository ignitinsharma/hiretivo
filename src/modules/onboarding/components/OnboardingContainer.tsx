'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  completeRecruiterOnboarding,
  saveRecruiterProfile,
  skipRecruiterJobOnboarding,
} from '@/app/actions/onboarding/recruiter';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/store/use-recruiter-onboarding-store';
import { StepRoleHiring } from './StepRoleHiring';
import { StepCompanyProfile } from './StepCompanyProfile';
import { StepPostJob } from './StepPostJob';
import { StepComplete } from './StepComplete';
import type {
  OnboardingStep,
  Step1Data,
  Step2Data,
  Step3Data,
} from '@/modules/onboarding/types/onboarding.types';

const stepLabels = ['Role', 'Company', 'Job', 'Complete'];

interface OnboardingContainerProps {
  initialStep: OnboardingStep;
  initialData: {
    step1: Partial<Step1Data>;
    step2: Partial<Step2Data>;
    step3?: Partial<Step3Data>;
  };
}

export function OnboardingContainer({
  initialStep,
  initialData,
}: OnboardingContainerProps) {
  const router = useRouter();
  const {
    currentStep,
    nextStep,
    previousStep,
    setCurrentStep,
    initializeOnboarding,
    completeOnboarding,
    step2,
  } = useOnboardingStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSkippingJob, setIsSkippingJob] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const progressPercent = ((currentStep - 1) / 3) * 100;

  useEffect(() => {
    initializeOnboarding({
      currentStep: initialStep,
      ...initialData,
    });
    window.localStorage.removeItem('hiretivo-onboarding');
  }, [initialData, initialStep, initializeOnboarding]);

  const handleSkipJob = async () => {
    if (isSkippingJob) return;
    setIsSkippingJob(true);
    const result = await skipRecruiterJobOnboarding();
    if (!result.success) {
      console.error("[OnboardingContainer] skipRecruiterJobOnboarding failed:", result.error);
      setIsSkippingJob(false);
      return;
    }
    setCurrentStep(4);
    setIsSkippingJob(false);
  };

  const handleComplete = async (destination?: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setCompleteError(null);

    // Safety net: re-save profile in case StepCompanyProfile's save failed silently.
    // Failure here is non-fatal — profile may already exist from step 2.
    if (step2.companyName) {
      const saveResult = await saveRecruiterProfile({
        companyName: step2.companyName,
        website: step2.companyWebsite || null,
        companySize: step2.companySize,
        bio: null,
        industry: step2.industry,
        fundingType: step2.fundingType,
        isFullyRemote: step2.isFullyRemote,
        logo: step2.logoUrl,
      });
      if (!saveResult.success) {
        console.error("[OnboardingContainer] safety-net saveRecruiterProfile failed:", saveResult.error);
        setCompleteError(saveResult.error);
        setIsNavigating(false);
        return;
      }
    }

    const result = await completeRecruiterOnboarding();
    if (!result.success) {
      console.error("[OnboardingContainer] completeRecruiterOnboarding failed:", result.error);
      setCompleteError(result.error);
      setIsNavigating(false);
      return;
    }

    completeOnboarding();
    router.push(destination ?? '/recruiter/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepRoleHiring
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <StepCompanyProfile
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      case 3:
        return (
          <StepPostJob
            onNext={nextStep}
            onBack={previousStep}
            onSkip={handleSkipJob}
            isSkipping={isSkippingJob}
          />
        );
      case 4:
        return <StepComplete onComplete={handleComplete} isLoading={isNavigating} error={completeError} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingShell>
      {currentStep < 4 && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Step {currentStep} of 4
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.round(progressPercent)}% Complete
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
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
            {stepLabels.map((label, index) => (
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
