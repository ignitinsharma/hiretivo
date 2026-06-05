"use client";

import { useState } from "react";
import { ArrowRight, Hand } from "lucide-react";

import { IndiaStateCombobox } from "@/components/forms/IndiaStateCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SITUATION_OPTIONS,
  EXPERIENCE_LEVELS,
  validateSeekerStep1,
} from "@/lib/validations/seeker-onboarding.schema";
import type {
  SeekerSituation,
  ExperienceLevel,
} from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep1 } from "@/app/actions/onboarding/seeker";

/*
 * StepWelcome
 * Step 1 of seeker onboarding — About You.
 * Captures current situation, experience level, city, and state/UT.
 * Saves to DB via saveStep1 before advancing.
 */
interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const { step1, userName, setSituation, setExperienceLevel, setCity, setState } =
    useSeekerOnboardingStore();
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (isSaving) return;
    const validation = validateSeekerStep1({
      situation: step1.situation ?? undefined,
      experienceLevel: step1.experienceLevel ?? undefined,
      city: step1.city ?? undefined,
      state: step1.state ?? undefined,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setIsSaving(true);
    const result = await saveStep1({
      situation: step1.situation!,
      experienceLevel: step1.experienceLevel!,
      city: step1.city!,
      state: step1.state!,
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
    if (errors.includes("Please select your experience level"))
      return "Please select your experience level";
    if (errors.includes("Please enter your city")) return "Please enter your city";
    if (errors.includes("Please select your state or union territory"))
      return "Please select your state or union territory";
    return errors[0] ?? null;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-primary/10 mb-4">
            <Hand className="w-7 h-7 text-brand-primary" />
          </div>
          <h2 className="text-3xl font-semibold text-brand-foreground">
            Welcome to Hiretivo, {userName}!
          </h2>
          <p className="text-brand-foreground-muted text-lg">
            Let&apos;s build your verified engineer profile. Takes about 5 minutes.
          </p>
        </div>

        <div className="space-y-8">
          {/* Situation */}
          <div className="space-y-4">
            <label className="text-base font-medium text-brand-foreground block">
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
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-brand-border hover:border-brand-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0",
                        isSelected
                          ? "bg-brand-primary text-white"
                          : "bg-brand-surface",
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
                          isSelected
                            ? "text-brand-primary"
                            : "text-brand-foreground",
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-sm text-brand-foreground-muted">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience level */}
          <div className="space-y-4">
            <label className="text-base font-medium text-brand-foreground block">
              What&apos;s your experience level?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EXPERIENCE_LEVELS.map((option) => {
                const isSelected = step1.experienceLevel === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setExperienceLevel(option.value as ExperienceLevel);
                      setErrors([]);
                    }}
                    className={cn(
                      "flex items-center justify-center p-4 rounded-lg border-2 transition-all text-sm font-medium",
                      isSelected
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand-border hover:border-brand-primary/50 text-brand-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">
              City
            </label>
            <Input
              value={step1.city ?? ""}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru"
              disabled={isSaving}
              aria-label="City"
            />
            <p className="text-xs text-brand-foreground-muted">
              Recruiters see this to evaluate timezone fit.
            </p>
          </div>

          {/* State / UT */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">
              State / Union Territory
            </label>
            <IndiaStateCombobox
              value={step1.state ?? ""}
              onValueChange={(val) => {
                setState(val);
                setErrors([]);
              }}
              disabled={isSaving}
            />
          </div>

          {getErrorMessage() && (
            <p className="text-sm text-brand-danger text-center">
              {getErrorMessage()}
            </p>
          )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
