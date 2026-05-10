'use client';

import { useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateStep1 } from '@/lib/validations/recruiter-onboarding.schema';
import type { RecruiterRole, HiringScale } from '@/lib/validations/recruiter-onboarding.schema';
import { useOnboardingStore } from '@/store/use-recruiter-onboarding-store';
import { saveRecruiterRole } from '@/app/actions/onboarding/recruiter';

interface StepRoleHiringProps {
  onNext: () => void;
  onSkip?: () => void;
}

const roleOptions: { value: RecruiterRole; label: string }[] = [
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
  { value: 'HR_RECRUITER', label: 'HR / Recruiter' },
  { value: 'OTHER', label: 'Other' },
];

const hiringScaleOptions: { value: HiringScale; label: string }[] = [
  { value: '1-5', label: '1–5' },
  { value: '6-20', label: '6–20' },
  { value: '21-50', label: '21–50' },
  { value: '50+', label: '50+' },
];

export function StepRoleHiring({ onNext, onSkip }: StepRoleHiringProps) {
  const { step1, setRole, setHiringScale } = useOnboardingStore();
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (isSaving) return;
    const validation = validateStep1({
      role: step1.role ?? undefined,
      hiringScale: step1.hiringScale ?? undefined,
    });
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors([]);
    setIsSaving(true);
    const result = await saveRecruiterRole({
      role: step1.role!,
      hiringScale: step1.hiringScale!,
    });
    setIsSaving(false);

    if (!result.success) {
      setErrors([result.error]);
      return;
    }

    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Welcome to Hiretivo!</h2>
          <p className="text-muted-foreground">Let&apos;s get your hiring account set up. Takes about 3 minutes.</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-base font-medium text-foreground block">
              I am a...
            </label>
            <div className="grid grid-cols-1 gap-3">
              {roleOptions.map((option) => {
                const isSelected = step1.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRole(option.value);
                      setErrors([]);
                    }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {isSelected ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn(
                      'font-medium',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.includes('Please select your role') && (
              <p className="text-sm text-destructive">Please select your role</p>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-base font-medium text-foreground block">
              How many people are you planning to hire this year?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hiringScaleOptions.map((option) => {
                const isSelected = step1.hiringScale === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setHiringScale(option.value);
                      setErrors([]);
                    }}
                    className={cn(
                      'flex items-center justify-center p-4 rounded-lg border-2 transition-all font-medium',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50 text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.includes('Please select hiring scale') && (
              <p className="text-sm text-destructive">Please select hiring scale</p>
            )}
            {errors.length > 0 &&
              !errors.includes('Please select your role') &&
              !errors.includes('Please select hiring scale') && (
                <p className="text-sm text-destructive">{errors[0]}</p>
              )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleContinue}
              size="lg"
              variant="primary"
              className="w-full"
              loading={isSaving}
              loadingText="Saving..."
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            {onSkip && (
              <Button type="button" variant="ghost" onClick={onSkip} className="w-full">
                Skip setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
