import type { ParsedResumeDraft } from "@/lib/validations/resume-parse.schema";
import { ProgressiveStep } from "@/constants/enums";

/* Client-side state for the lean upload→parse→review onboarding flow. */
export interface ProgressiveOnboardingState {
  step: ProgressiveStep;
  resumeKey: string | null;
  draft: ParsedResumeDraft | null;
  isManualFallback: boolean;
}
