"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingShell } from "@/components/layout/OnboardingShell";
import { ProgressiveStep } from "@/constants/enums";
import { useProgressiveOnboardingStore } from "@/store/use-progressive-onboarding-store";
import { StepUploadResume } from "./StepUploadResume";
import { StepReviewParse } from "./StepReviewParse";

const STEPS = [
  { key: ProgressiveStep.UPLOAD, label: "Upload" },
  { key: ProgressiveStep.REVIEW, label: "Review" },
] as const;

interface ProgressiveOnboardingContainerProps {
  userName: string;
}

/*
 * ProgressiveOnboardingContainer
 * Root client component for the lean apply-faster onboarding flow: upload →
 * AI-parse → review/correct → browse immediately (no verification wall).
 * Entry point when the `PROGRESSIVE_ONBOARDING` flag is on.
 */
export function ProgressiveOnboardingContainer({ userName }: ProgressiveOnboardingContainerProps) {
  const { step } = useProgressiveOnboardingStore();
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <OnboardingShell>
      <div className="max-w-2xl mx-auto mb-8">
        <p className="text-sm text-brand-foreground-muted mb-3">Hey {userName}, let&apos;s get you set up</p>
        <div className="flex items-center gap-3">
          {STEPS.map((s, index) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-lg text-xs font-medium shrink-0",
                  index < activeIndex
                    ? "bg-brand-primary text-brand-primary-foreground"
                    : index === activeIndex
                      ? "bg-brand-primary text-brand-primary-foreground"
                      : "bg-brand-surface text-brand-foreground-muted",
                )}
              >
                {index < activeIndex ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  index <= activeIndex ? "text-brand-foreground" : "text-brand-foreground-muted",
                )}
              >
                {s.label}
              </span>
              {index < STEPS.length - 1 && <div className="flex-1 h-px bg-brand-border" />}
            </div>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in duration-300">
        {step === ProgressiveStep.UPLOAD && <StepUploadResume />}
        {step === ProgressiveStep.REVIEW && <StepReviewParse />}
      </div>
    </OnboardingShell>
  );
}
