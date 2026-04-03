'use client';

import { Rocket, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';
import { StepWelcome } from './StepWelcome';
import { StepSkills } from './StepSkills';
import { StepResume } from './StepResume';
import { StepPreferences } from './StepPreferences';
import { StepSeekerComplete } from './StepSeekerComplete';

const STEP_LABELS = ['Welcome', 'Skills', 'Resume', 'Preferences', 'Complete'];

export function SeekerOnboardingContainer() {
  const router = useRouter();
  const { currentStep, nextStep, previousStep, completeOnboarding } = useSeekerOnboardingStore();

  const progressPercent = ((currentStep - 1) / 4) * 100;

  const handleComplete = () => {
    completeOnboarding();
    router.push('/seeker/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepWelcome
            onNext={nextStep}
            onSkip={() => nextStep()}
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
