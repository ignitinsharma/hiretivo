'use client';

import { Rocket, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/store/use-recruiter-onboarding-store';
import { StepRoleHiring } from './StepRoleHiring';
import { StepCompanyProfile } from './StepCompanyProfile';
import { StepPostJob } from './StepPostJob';
import { StepComplete } from './StepComplete';
import { saveRecruiterProfile } from '@/app/actions/onboarding/recruiter';

const stepLabels = ['Role', 'Company', 'Job', 'Complete'];

export function OnboardingContainer() {
  const router = useRouter();
  const { currentStep, nextStep, previousStep, completeOnboarding, step2 } = useOnboardingStore();
  const [isNavigating, setIsNavigating] = useState(false);

  const progressPercent = ((currentStep - 1) / 3) * 100;

  const handleComplete = async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    // Ensure recruiterProfile exists in DB before navigating to dashboard
    // This is a safety net in case StepCompanyProfile's save failed
    if (step2.companyName) {
      await saveRecruiterProfile({
        companyName: step2.companyName,
        website: step2.companyWebsite || null,
        companySize: step2.companySize,
        bio: null,
        industry: step2.industry,
        fundingType: step2.fundingType,
        isFullyRemote: step2.isFullyRemote,
        logo: step2.logoUrl,
      });
    }

    completeOnboarding();
    router.push('/recruiter/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepRoleHiring
            onNext={nextStep}
            onSkip={() => nextStep()}
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
            onSkip={() => nextStep()}
          />
        );
      case 4:
        return <StepComplete onComplete={handleComplete} isLoading={isNavigating} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Hiretivo</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Your data is secured with enterprise-grade encryption.</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
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

          <div className="animate-in fade-in duration-300">
            {renderStep()}
          </div>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Hiretivo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
