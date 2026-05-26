"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SUPPORT_URL } from "@/lib/config";
import type { SeekerOnboardingStep } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";

interface StepSeekerCompleteProps {
  onComplete: () => Promise<
    | { success: true; redirectTo: "/seeker/verification" }
    | {
        success: false;
        error: string;
        missingStep: SeekerOnboardingStep;
      }
  >;
}

const NEXT_STEPS = [
  {
    title: "Profile saved",
    description: "Your skills, salary, resume, and availability are saved.",
    icon: CheckCircle2,
  },
  {
    title: "Verification review",
    description: "Submit GitHub and profile details for admin review.",
    icon: ClipboardCheck,
  },
  {
    title: "Apply and get discovered",
    description: "After verification, you can apply and appear in recruiter search.",
    icon: ShieldCheck,
  },
] as const;

export function StepSeekerComplete({ onComplete }: StepSeekerCompleteProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setCompletionError(null);
    try {
      const result = await onComplete();
      if (result?.success === false) {
        setCompletionError(result.error);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-brand-foreground">
            Profile saved
          </h2>
          <p className="text-lg leading-relaxed text-brand-foreground-muted">
            Next, submit verification so you can apply to jobs and appear in
            recruiter search.
          </p>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-4 text-left">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {NEXT_STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="rounded-lg bg-brand-surface p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-brand-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {completionError && (
            <p className="text-sm text-destructive text-center">
              {completionError}
            </p>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleComplete}
            size="lg"
            className="w-full"
            loading={isCompleting}
            loadingText="Saving..."
          >
            Submit for verification
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-sm text-brand-foreground-muted">
          Need help?{' '}
          <Link href={SUPPORT_URL} className="text-brand-primary hover:underline">
            Chat with support
          </Link>
        </p>
      </div>
    </div>
  );
}
