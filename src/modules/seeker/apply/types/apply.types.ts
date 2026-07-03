import type { ApplicationStatus, ApplySource } from "@/constants/enums";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";
import type { KeywordStats } from "@/lib/apply/keyword-match";

/*
 * ApplicationDetail
 * Full record returned by GET /api/seeker/applications/[id] — the job/JD
 * context the wizard tailors against, plus any artifacts already saved on a
 * resumed or completed run.
 */
export interface ApplicationDetail {
  id: string;
  jobId: string | null;
  source: ApplySource;
  status: ApplicationStatus;
  matchScore: number;
  jobTitle: string;
  companyName: string;
  jdText: string;
  requiredSkills: string[];
  preferredSkills: string[];
  externalJobUrl: string | null;
  /** Resolved ATS apply link to open in Submit — Job.externalApplyUrl for
   * FEED applications, or externalJobUrl itself for PASTED_LINK (Phase 7). */
  applyUrl: string | null;
  tailoredResumeKey: string | null;
  /** Signed download URL for tailoredResumeKey, resolved server-side; null until finalize. */
  tailoredResumeUrl: string | null;
  coverLetter: string | null;
  submittedFormData: SubmittedFormField[] | null;
  keywordStats: KeywordStats | null;
  createdAt: string;
}

/*
 * ApplyKeywordStats
 * Re-export of lib/apply/keyword-match's KeywordStats (Phase 4) — the
 * required/preferred JD-skill match counts shown during the optimize step
 * and persisted on the Application at finalize. Kept as a named re-export
 * so apply-module consumers import from apply.types.ts, not lib/apply/*.
 */
export type ApplyKeywordStats = KeywordStats;

/*
 * SubmittedFormField
 * One ATS-form answer captured at finalize — extension-ready (Phase 8.5
 * autofill reads this same shape).
 */
export interface SubmittedFormField {
  fieldKey: string;
  label: string;
  value: string;
}

/*
 * ApplyWizardState
 * In-memory wizard state: current step plus the editable artifacts the user
 * is tailoring before finalize.
 */
export interface ApplyWizardState {
  resume: ResumeDocument | null;
  coverLetter: string;
  reservationHandle: string | null;
  isDirty: boolean;
}
