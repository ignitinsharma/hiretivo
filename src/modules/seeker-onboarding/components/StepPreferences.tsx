"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Briefcase,
  RefreshCw,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  validateSeekerStep4,
  JOB_TYPES,
  JOB_CATEGORIES,
  CURRENCIES,
  AVAILABILITY_OPTIONS,
} from "@/lib/validations/seeker-onboarding.schema";
import type {
  JobType,
  JobCategory,
  Currency,
  Availability,
} from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep4 } from "@/app/actions/onboarding/seeker";

interface StepPreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

const JOB_TYPE_ICONS: Record<JobType, typeof Briefcase> = {
  FULL_TIME: Briefcase,
  CONTRACT: RefreshCw,
  BOTH: Zap,
};

export function StepPreferences({ onNext, onBack }: StepPreferencesProps) {
  const {
    step4,
    setJobType,
    setCategory,
    setSalaryRange,
    setCurrency,
    setAvailability,
  } = useSeekerOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (isSaving) return;
    const validation = validateSeekerStep4({
      jobType: step4.jobType ?? undefined,
      category: step4.category ?? undefined,
      salaryRange: step4.salaryRange,
      availability: step4.availability ?? undefined,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);

    // Persist to DB before advancing (per D-04)
    setIsSaving(true);
    const result = await saveStep4({
      jobType: step4.jobType,
      category: step4.category,
      salaryMin: step4.salaryRange.min,
      salaryMax: step4.salaryRange.max,
      currency: step4.salaryRange.currency,
      availability: step4.availability,
      workPreference: null,
    });
    setIsSaving(false);

    if (!result.success) {
      console.error("[StepPreferences] saveStep4 failed:", result.error);
      setErrors([result.error]);
      return;
    }

    onNext();
  };

  const getErrorMessage = () => {
    if (errors.includes("Please select job type"))
      return "Please select job type";
    if (errors.includes("Please select category"))
      return "Please select category";
    if (errors.includes("Please select availability"))
      return "Please select availability";
    return errors[0] ?? null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            What are you looking for?
          </h2>
          <p className="text-muted-foreground">
            We&apos;ll only show you jobs that match.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Job Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {JOB_TYPES.map((option) => {
                  const Icon = JOB_TYPE_ICONS[option.value];
                  const isSelected = step4.jobType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setJobType(option.value as JobType);
                        setErrors([]);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {JOB_CATEGORIES.map((option) => {
                  const isSelected = step4.category === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setCategory(option.value as JobCategory);
                        setErrors([]);
                      }}
                      className={cn(
                        "flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 text-foreground",
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
                Desired Salary (Annual)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={step4.salaryRange.min ?? ""}
                    onChange={(e) =>
                      setSalaryRange(
                        e.target.value ? parseInt(e.target.value) : null,
                        step4.salaryRange.max,
                      )
                    }
                    className="pl-7"
                  />
                </div>
                <span className="text-muted-foreground">–</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={step4.salaryRange.max ?? ""}
                    onChange={(e) =>
                      setSalaryRange(
                        step4.salaryRange.min,
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="pl-7"
                  />
                </div>
                <select
                  value={step4.salaryRange.currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="px-3 py-2 rounded-md text-sm font-medium border border-input bg-background"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Availability
              </label>
              <div className="grid grid-cols-3 gap-3">
                {AVAILABILITY_OPTIONS.map((option) => {
                  const isSelected = step4.availability === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setAvailability(option.value as Availability);
                        setErrors([]);
                      }}
                      className={cn(
                        "flex items-center justify-center p-4 rounded-lg border-2 transition-all text-sm font-medium",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {getErrorMessage() && (
              <p className="text-sm text-destructive text-center">
                {getErrorMessage()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleContinue}
              size="lg"
              className="w-full"
              variant={"primary"}
              loading={isSaving}
              loadingText="Saving..."
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
