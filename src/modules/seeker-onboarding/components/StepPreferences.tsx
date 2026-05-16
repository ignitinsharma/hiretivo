"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateSeekerStep4 } from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep4 } from "@/app/actions/onboarding/seeker";

interface StepPreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

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
    const validation = validateSeekerStep4({
      targetSalaryMin: step4.targetSalaryMin,
      targetSalaryMax: step4.targetSalaryMax,
      timezoneOverlapHours: step4.timezoneOverlapHours,
      availableFrom: step4.availableFrom,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
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
    if (errors.includes("Please enter timezone overlap hours"))
      return "Please enter timezone overlap hours";
    if (errors.includes("Please select availability date"))
      return "Please select availability date";
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
                Timezone overlap hours
              </label>
              <Input
                type="number"
                min={0}
                max={16}
                placeholder="e.g. 4"
                value={step4.timezoneOverlapHours ?? ""}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value, 10);
                  setTimezoneOverlapHours(Number.isNaN(value) ? null : value);
                  setErrors([]);
                }}
              />
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
