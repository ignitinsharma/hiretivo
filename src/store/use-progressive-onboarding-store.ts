import { create } from "zustand";
import { ProgressiveStep } from "@/constants/enums";
import type { ProgressiveOnboardingState } from "@/modules/seeker-onboarding/types/progressive-onboarding.types";
import type { ParsedResumeDraft } from "@/lib/validations/resume-parse.schema";

interface ProgressiveOnboardingActions {
  setStep: (step: ProgressiveStep) => void;
  setParseResult: (result: { draft: ParsedResumeDraft; resumeKey: string }) => void;
  enterManualFallback: (resumeKey: string | null) => void;
  updateDraft: (partial: Partial<ParsedResumeDraft>) => void;
  reset: () => void;
}

const initialState: ProgressiveOnboardingState = {
  step: ProgressiveStep.UPLOAD,
  resumeKey: null,
  draft: null,
  isManualFallback: false,
};

/*
 * useProgressiveOnboardingStore
 * Thin, transient Zustand store for the lean upload→parse→review onboarding
 * flow. No persist — the draft is a client-side scratchpad only; the
 * source of truth is the DB once `saveParsedProfile` runs.
 */
export const useProgressiveOnboardingStore = create<
  ProgressiveOnboardingState & ProgressiveOnboardingActions
>((set) => ({
  ...initialState,

  /* setStep — advance/rewind the flow between upload, review, and done. */
  setStep: (step) => set({ step }),

  /* setParseResult — store a successful LLM parse and move to the review step. */
  setParseResult: ({ draft, resumeKey }) =>
    set({ draft, resumeKey, isManualFallback: false, step: ProgressiveStep.REVIEW }),

  /* enterManualFallback — image-PDF or user-chosen manual path: empty draft, review step. */
  enterManualFallback: (resumeKey) =>
    set({ draft: null, resumeKey, isManualFallback: true, step: ProgressiveStep.REVIEW }),

  /* updateDraft — merge edited fields from the review form back into the draft. */
  updateDraft: (partial) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...partial } : state.draft,
    })),

  /* reset — clear the flow back to its initial upload state. */
  reset: () => set(initialState),
}));
