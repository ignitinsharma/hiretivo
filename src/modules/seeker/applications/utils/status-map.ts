import { ApplicationStatus } from '@/constants/enums';

/*
 * DashboardTab
 * Tab ids for the /dashboard applications table (B3) — a coarser view than
 * ApplicationStatus, derived from whether AI artifacts exist yet, not the
 * ATS-lifecycle status alone (see DashboardApplicationSummary docstring).
 */
export enum DashboardTab {
  ALL = 'all',
  SUBMITTED = 'submitted',
  IN_FLIGHT = 'in-flight',
  NEEDS_YOU = 'needs-you',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export const DASHBOARD_TABS: DashboardTab[] = [
  DashboardTab.ALL,
  DashboardTab.SUBMITTED,
  DashboardTab.IN_FLIGHT,
  DashboardTab.NEEDS_YOU,
  DashboardTab.FAILED,
  DashboardTab.SKIPPED,
];

export const DASHBOARD_TAB_LABELS: Record<DashboardTab, string> = {
  [DashboardTab.ALL]: 'All',
  [DashboardTab.SUBMITTED]: 'Submitted',
  [DashboardTab.IN_FLIGHT]: 'In-flight',
  [DashboardTab.NEEDS_YOU]: 'Needs you',
  [DashboardTab.FAILED]: 'Failed',
  [DashboardTab.SKIPPED]: 'Skipped',
};

/*
 * TrackerColumn
 * Kanban column ids for /dashboard/tracker (Section F), one per ATS-lifecycle
 * stage. Distinct from DashboardTab: the tracker only shows applications that
 * have actually been submitted (tailoredResumeKey set) — see
 * deriveTrackerColumn's null return for in-flight/needs-you/failed rows.
 */
export enum TrackerColumn {
  APPLIED = 'APPLIED',
  GHOSTED = 'GHOSTED',
  INTERVIEWING = 'INTERVIEWING',
  REJECTED = 'REJECTED',
  OFFER = 'OFFER',
}

export const TRACKER_COLUMNS: TrackerColumn[] = [
  TrackerColumn.APPLIED,
  TrackerColumn.GHOSTED,
  TrackerColumn.INTERVIEWING,
  TrackerColumn.REJECTED,
  TrackerColumn.OFFER,
];

export const TRACKER_COLUMN_LABELS: Record<TrackerColumn, string> = {
  [TrackerColumn.APPLIED]: 'Applied',
  [TrackerColumn.GHOSTED]: 'Ghosted',
  [TrackerColumn.INTERVIEWING]: 'Interviewing',
  [TrackerColumn.REJECTED]: 'Rejected',
  [TrackerColumn.OFFER]: 'Offer',
};

/*
 * StatusMappableApplication
 * The minimal shape both mapping functions need. `status` alone can't tell
 * you whether a run was actually submitted — schema default is APPLIED at
 * creation, before the wizard finalizes anything (see
 * src/app/api/seeker/applications/route.ts docstring) — so callers must pass
 * the artifact-presence flags too.
 */
export interface StatusMappableApplication {
  status: ApplicationStatus;
  /** True once the wizard's finalize step has rendered + stored a resume (tailoredResumeKey set). */
  isFinalized: boolean;
  /** True once the seeker has confirmed "I submitted" (submittedFormData set). */
  hasSubmittedForm: boolean;
  /** True if the last generation/render step errored and no artifact was produced. */
  hasGenerationError?: boolean;
  /** True if the seeker passed on this job (DismissedJob) rather than applying. */
  isSkipped?: boolean;
  /**
   * True for a manually logged (Add-application modal) or CSV-imported row
   * (ApplySource.MANUAL) — these never go through the wizard, so
   * `isFinalized`/`hasSubmittedForm` are always false and would otherwise
   * strand them in In-flight forever. They represent an application the
   * seeker already submitted outside the tool, so both mapping functions
   * treat them as submitted immediately.
   */
  isManualEntry?: boolean;
}

/*
 * deriveDashboardTab
 * Maps an application to exactly one /dashboard applications-table tab.
 * Precedence: skipped > generation error > not finalized (in-flight) >
 * finalized-but-not-submitted (needs-you) > submitted.
 */
export function deriveDashboardTab(app: StatusMappableApplication): DashboardTab {
  if (app.isSkipped) return DashboardTab.SKIPPED;
  if (app.hasGenerationError) return DashboardTab.FAILED;
  if (app.isManualEntry) return DashboardTab.SUBMITTED;
  if (!app.isFinalized) return DashboardTab.IN_FLIGHT;
  if (!app.hasSubmittedForm) return DashboardTab.NEEDS_YOU;
  return DashboardTab.SUBMITTED;
}

/*
 * deriveTrackerColumn
 * Maps an application to a kanban column, or null if it doesn't belong on
 * the tracker yet (not finalized, generation failed, or skipped — those live
 * only in the dashboard table's In-flight/Failed/Skipped tabs).
 */
export function deriveTrackerColumn(app: StatusMappableApplication): TrackerColumn | null {
  if (app.isSkipped || app.hasGenerationError) return null;
  if (!app.isFinalized && !app.isManualEntry) return null;

  switch (app.status) {
    case ApplicationStatus.GHOSTED:
      return TrackerColumn.GHOSTED;
    case ApplicationStatus.REVIEWING:
    case ApplicationStatus.INTERVIEW:
      return TrackerColumn.INTERVIEWING;
    case ApplicationStatus.REJECTED:
      return TrackerColumn.REJECTED;
    case ApplicationStatus.OFFER:
    case ApplicationStatus.HIRED:
      return TrackerColumn.OFFER;
    case ApplicationStatus.APPLIED:
    default:
      return TrackerColumn.APPLIED;
  }
}

/*
 * TRACKER_COLUMN_DROP_STATUS
 * Reverse of deriveTrackerColumn's switch, used by F2's drag-and-drop: which
 * ApplicationStatus to write when a card is dropped on a given column.
 * Lossy by design — INTERVIEWING collapses REVIEWING+INTERVIEW and OFFER
 * collapses OFFER+HIRED into one column each (D4), so a drop always writes
 * the more common/literal member of the pair (INTERVIEW, OFFER) rather than
 * trying to preserve whichever one the row had before.
 */
export const TRACKER_COLUMN_DROP_STATUS: Record<TrackerColumn, ApplicationStatus> = {
  [TrackerColumn.APPLIED]: ApplicationStatus.APPLIED,
  [TrackerColumn.GHOSTED]: ApplicationStatus.GHOSTED,
  [TrackerColumn.INTERVIEWING]: ApplicationStatus.INTERVIEW,
  [TrackerColumn.REJECTED]: ApplicationStatus.REJECTED,
  [TrackerColumn.OFFER]: ApplicationStatus.OFFER,
};
