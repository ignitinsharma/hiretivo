'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Construction } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkillsTagInput } from '@/components/forms/skills-tag-input';
import { cn } from '@/lib/utils';
import { 
  validateSeekerStep2, 
  SUGGESTED_SKILLS, 
  YEARS_OPTIONS 
} from '@/lib/validations/seeker-onboarding.schema';
import type { YearsOfExperience } from '@/lib/validations/seeker-onboarding.schema';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';
import { saveStep2 } from '@/app/actions/onboarding/seeker';

interface StepSkillsProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepSkills({ onNext, onBack }: StepSkillsProps) {
  const { 
    step2, 
    setPrimaryRole, 
    setYearsOfExperience, 
    setSkills,
    addSkill 
  } = useSeekerOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);

  const handleContinue = async () => {
    const validation = validateSeekerStep2({
      primaryRole: step2.primaryRole,
      yearsOfExperience: step2.yearsOfExperience ?? undefined,
      skills: step2.skills,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);

    // Persist to DB before advancing (per D-04)
    const result = await saveStep2({
      primaryRole: step2.primaryRole,
      yearsOfExperience: step2.yearsOfExperience,
      skills: step2.skills,
    });

    if (!result.success) {
      console.error("[StepSkills] saveStep2 failed:", result.error);
    }

    onNext();
  };

  const getErrorMessage = () => {
    if (errors.includes("Primary role is required")) return "Primary role is required";
    if (errors.includes("Please select years of experience")) return "Please select years of experience";
    if (errors.includes("At least one skill is required")) return "At least one skill is required";
    return null;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Construction className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            What are your top skills?
          </h2>
          <p className="text-muted-foreground">
            We use this to match you with the best remote jobs.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Primary role
              </label>
              <Input
                placeholder="e.g. Frontend Developer"
                value={step2.primaryRole}
                onChange={(e) => {
                  setPrimaryRole(e.target.value);
                  setErrors([]);
                }}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Years of experience
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {YEARS_OPTIONS.map((option) => {
                  const isSelected = step2.yearsOfExperience === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setYearsOfExperience(option.value as YearsOfExperience);
                        setErrors([]);
                      }}
                      className={cn(
                        'flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium',
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
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Top skills
              </label>
              <SkillsTagInput
                value={step2.skills}
                onChange={(skills) => {
                  setSkills(skills);
                  setErrors([]);
                }}
                placeholder="e.g. React, TypeScript, Node.js"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Suggested
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isAdded = step2.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => !isAdded && addSkill(skill)}
                      disabled={isAdded}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        isAdded
                          ? 'bg-primary/10 text-primary cursor-default'
                          : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      )}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {getErrorMessage() && (
              <p className="text-sm text-destructive text-center">{getErrorMessage()}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button type="button" onClick={handleContinue} size="lg" className="w-full">
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
