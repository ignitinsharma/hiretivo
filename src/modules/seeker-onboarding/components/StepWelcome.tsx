"use client";

import { useState } from "react";
import { ArrowRight, Hand } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SITUATION_OPTIONS,
  validateSeekerStep1,
} from "@/lib/validations/seeker-onboarding.schema";
import type { SeekerSituation } from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep1 } from "@/app/actions/onboarding/seeker";

interface StepWelcomeProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function StepWelcome({ onNext, onSkip }: StepWelcomeProps) {
  const { step1, userName, setSituation } =
    useSeekerOnboardingStore();
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (isSaving) return;
    const validation = validateSeekerStep1({
      situation: step1.situation ?? undefined,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);

    // Persist to DB before advancing (per D-04)
    setIsSaving(true);
    const result = await saveStep1({
      situation: step1.situation!,
    });
    setIsSaving(false);

    if (!result.success) {
      console.error("[StepWelcome] saveStep1 failed:", result.error);
      setErrors([result.error]);
      return;
    }

    onNext();
  };

  const getErrorMessage = () => {
    if (errors.includes("Please select your current situation"))
      return "Please select your current situation";
    return errors[0] ?? null;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Hand className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold text-foreground">
            Welcome to Hiretivo, {userName}!
          </h2>
          <p className="text-muted-foreground text-lg">
            Let&apos;s personalize your job feed. Takes 2 minutes.
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-base font-medium text-foreground block">
              What&apos;s your current situation?
            </label>
            <div className="grid grid-cols-1 gap-3">
              {SITUATION_OPTIONS.map((option) => {
                const isSelected = step1.situation === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSituation(option.value as SeekerSituation);
                      setErrors([]);
                    }}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      {isSelected ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span>{option.icon}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
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

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleContinue}
              size="lg"
              variant={"primary"}
              className="w-full"
              loading={isSaving}
              loadingText="Saving..."
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            {onSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                className="w-full"
              >
                Skip setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
