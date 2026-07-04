import type { ApplicationStatus, ApplySource } from '@/constants/enums';

/*
 * DashboardApplicationSummary
 * One row of the /dashboard applications table (and the /dashboard/tracker
 * kanban, which consumes the same list). `kind: 'dismissed'` rows come from
 * DismissedJob (passed, never applied) and only ever land in the Skipped tab
 * — they have no wizard/status data and aren't clickable into the wizard.
 *
 * KNOWN GAP: `hasGenerationError` is always false today — there is no
 * persisted "generation failed" state in the schema (a stuck not-finalized
 * row is indistinguishable from one the user simply hasn't finished yet).
 * Revisit if/when a failure needs to surface in the Failed tab.
 */
export interface DashboardApplicationSummary {
  id: string;
  kind: 'application' | 'dismissed';
  jobId: string | null;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string | null;
  status: ApplicationStatus | null;
  source: ApplySource | null;
  isFinalized: boolean;
  hasSubmittedForm: boolean;
  hasGenerationError: boolean;
  applyUrl: string | null;
  createdAt: string;
}
