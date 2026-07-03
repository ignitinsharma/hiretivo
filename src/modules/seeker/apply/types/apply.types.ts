import type { ApplicationStatus, ApplySource } from "@/constants/enums";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

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
  tailoredResumeKey: string | null;
  coverLetter: string | null;
  submittedFormData: SubmittedFormField[] | null;
  keywordStats: ApplyKeywordStats | null;
  createdAt: string;
}

/*
 * ApplyKeywordStats
 * Required/preferred JD-skill match counts shown during the optimize step
 * and persisted on the Application at finalize.
 */
export interface ApplyKeywordStats {
  requiredMatched: string[];
  preferredMatched: string[];
  total: number;
}

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
