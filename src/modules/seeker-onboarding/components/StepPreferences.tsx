"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { step4Schema } from "@/lib/validations/seeker-onboarding.schema";
import { cn } from "@/lib/utils";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep4 } from "@/app/actions/onboarding/seeker";

interface StepPreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

const MEETING_AVAILABILITY_OPTIONS = [
  {
    value: 2,
    label: "Mostly async",
    description: "0-2 hours per day",
  },
  {
    value: 4,
    label: "Some overlap",
    description: "4 hours per day",
  },
  {
    value: 6,
    label: "Strong overlap",
    description: "6 hours per day",
  },
  {
    value: 8,
    label: "Very flexible",
    description: "8+ hours per day",
  },
] as const;

export function StepPreferences({ onNext, onBack }: StepPreferencesProps) {
  const {
    step4,
    setTargetSalaryRange,
    setTimezoneOverlapHours,
    setAvailableFrom,
  } = useSeekerOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (isSaving) return;
    const parsed = step4Schema.safeParse({
      targetSalaryMin: step4.targetSalaryMin,
      targetSalaryMax: step4.targetSalaryMax,
      timezoneOverlapHours: step4.timezoneOverlapHours,
      availableFrom: step4.availableFrom,
    });

    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    setErrors([]);

    // Persist to DB before advancing (per D-04)
    setIsSaving(true);
    const result = await saveStep4({
      targetSalaryMin: step4.targetSalaryMin!,
      targetSalaryMax: step4.targetSalaryMax!,
      timezoneOverlapHours: step4.timezoneOverlapHours!,
      availableFrom: step4.availableFrom!,
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
    if (errors.includes("Please enter minimum target salary"))
      return "Please enter minimum target salary";
    if (errors.includes("Please enter maximum target salary"))
      return "Please enter maximum target salary";
    if (errors.includes("Select your live meeting availability"))
      return "Select your live meeting availability";
    if (errors.includes("Please select availability date"))
      return "Please select availability date";
    return errors[0] ?? null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 mb-4">
            <Target className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-foreground">
            What are you looking for?
          </h2>
          <p className="text-brand-foreground-muted">
            We&apos;ll only show you jobs that match.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Target salary in USD
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={1000}
                    max={1000000}
                    placeholder="Min"
                    value={step4.targetSalaryMin ?? ""}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      setTargetSalaryRange(
                        Number.isNaN(value) ? null : value,
                        step4.targetSalaryMax,
                      );
                      setErrors([]);
                    }}
                    className="pl-7"
                  />
                </div>
                <span className="hidden text-muted-foreground sm:block">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={1000}
                    max={1000000}
                    placeholder="Max"
                    value={step4.targetSalaryMax ?? ""}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      setTargetSalaryRange(
                        step4.targetSalaryMin,
                        Number.isNaN(value) ? null : value,
                      );
                      setErrors([]);
                    }}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Live meeting availability
              </label>
              <p className="text-sm leading-relaxed text-brand-foreground-muted">
                How much live meeting time can you reliably offer on a normal
                workday? You do not need to calculate country-by-country
                timezone differences. Recruiters use this as a rough
                availability signal; exact interview times are scheduled later.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MEETING_AVAILABILITY_OPTIONS.map((option) => {
                  const isSelected = step4.timezoneOverlapHours === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setTimezoneOverlapHours(option.value);
                        setErrors([]);
                      }}
                      className={cn(
                        "rounded-lg border bg-white p-4 text-left transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
                        isSelected
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-brand-border hover:bg-brand-surface",
                      )}
                    >
                      <span className="block text-sm font-semibold text-brand-foreground">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm text-brand-foreground-muted">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Available from
              </label>
              <Input
                type="date"
                value={step4.availableFrom ?? ""}
                onChange={(e) => {
                  setAvailableFrom(e.target.value || null);
                  setErrors([]);
                }}
              />
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
