"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { useFieldErrors } from "@/modules/seeker-onboarding/hooks/use-field-errors";
import { saveStep1 } from "@/app/actions/onboarding/seeker";

const FIELD_ERROR_CLASS = "text-sm text-brand-danger";

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
  const {
    step1,
    userName,
    setSituation,
    setExperienceLevel,
    setCity,
    setState,
  } = useSeekerOnboardingStore();
  const fe = useFieldErrors();
  const { revalidate } = fe;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Recompute the live field-error map whenever any step 1 value changes so
  // fixed fields clear their red state immediately.
  useEffect(() => {
    revalidate(
      validateSeekerStep1({
        situation: step1.situation ?? undefined,
        experienceLevel: step1.experienceLevel ?? undefined,
        city: step1.city ?? undefined,
        state: step1.state ?? undefined,
      }).fieldErrors,
    );
  }, [
    step1.situation,
    step1.experienceLevel,
    step1.city,
    step1.state,
    revalidate,
  ]);

  /*
   * handleSubmit
   * Validates step 1, saves it to the server, and advances to the next step.
   * Handles both button clicks and native Enter-key form submission.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setServerError(null);
    const validation = validateSeekerStep1({
      situation: step1.situation ?? undefined,
      experienceLevel: step1.experienceLevel ?? undefined,
      city: step1.city ?? undefined,
      state: step1.state ?? undefined,
    });

    if (!validation.valid) {
      fe.setSubmitted(validation.fieldErrors);
      return;
    }

    setIsSaving(true);
    const result = await saveStep1({
      situation: step1.situation!,
      experienceLevel: step1.experienceLevel!,
      city: step1.city!,
      state: step1.state!,
    });
    setIsSaving(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    onNext();
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
            <Hand className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-foreground">
            Welcome to Hiretivo, {userName}!
          </h2>
          <p className="text-brand-foreground-muted">
            Let&apos;s build your verified engineer profile. Takes about 5
            minutes.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Situation */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-brand-foreground">
              What&apos;s your current situation?
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SITUATION_OPTIONS.map((option) => {
                const isSelected = step1.situation === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSituation(option.value as SeekerSituation)
                    }
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-28 rounded-xl border-2 p-3 text-left transition-all",
                      isSelected
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-brand-border bg-white hover:border-brand-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-base",
                        isSelected
                          ? "bg-brand-primary text-white"
                          : "bg-brand-surface",
                      )}
                    >
                      {isSelected ? (
                        <svg
                          className="h-4 w-4"
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
                    <div className="space-y-1.5">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug",
                          isSelected
                            ? "text-brand-primary"
                            : "text-brand-foreground",
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs leading-relaxed text-brand-foreground-muted">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {fe.errorFor("situation") && (
              <p className={FIELD_ERROR_CLASS}>{fe.errorFor("situation")}</p>
            )}
          </div>

          {/* Experience level */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-brand-foreground">
              What&apos;s your experience level?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPERIENCE_LEVELS.map((option) => {
                const isSelected = step1.experienceLevel === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setExperienceLevel(option.value as ExperienceLevel)
                    }
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 p-3 text-sm font-medium transition-all",
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
            {fe.errorFor("experienceLevel") && (
              <p className={FIELD_ERROR_CLASS}>
                {fe.errorFor("experienceLevel")}
              </p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              City
            </label>
            <Input
              value={step1.city ?? ""}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => fe.touch("city")}
              aria-invalid={fe.hasError("city")}
              placeholder="e.g. Bengaluru"
              disabled={isSaving}
              aria-label="City"
            />
            {fe.errorFor("city") ? (
              <p className={FIELD_ERROR_CLASS}>{fe.errorFor("city")}</p>
            ) : (
              <p className="text-sm text-brand-foreground-muted">
                Recruiters see this to evaluate timezone fit.
              </p>
            )}
          </div>

          {/* State / UT */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              State / Union Territory
            </label>
            <IndiaStateCombobox
              value={step1.state ?? ""}
              onValueChange={(val) => setState(val)}
              disabled={isSaving}
            />
            {fe.errorFor("state") && (
              <p className={FIELD_ERROR_CLASS}>{fe.errorFor("state")}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-brand-danger text-center">
              {serverError}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
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
        </form>
      </div>
    </div>
  );
}
