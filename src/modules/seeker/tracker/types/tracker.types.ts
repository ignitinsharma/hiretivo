import type { TrackerColumn } from '@/modules/seeker/applications/utils/status-map';
import type { DashboardApplicationSummary } from '@/modules/seeker/dashboard/types/applications-table.types';

/*
 * TrackerCard
 * A kanban card is the same row shape the /dashboard applications table
 * uses (DashboardApplicationSummary) — reused rather than duplicated as a
 * parallel type, since both views group the identical GET
 * /api/seeker/applications list, just by a different key
 * (deriveDashboardTab vs deriveTrackerColumn). `kind` is always
 * 'application' here — deriveTrackerColumn already filters out 'dismissed'
 * rows (they never map to a column).
 */
export type TrackerCard = DashboardApplicationSummary;

/*
 * TrackerColumnData
 * One kanban column: its id/label (from status-map.ts) plus the cards
 * currently grouped into it.
 */
export interface TrackerColumnData {
  column: TrackerColumn;
  cards: TrackerCard[];
}
