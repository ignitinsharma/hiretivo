import { useMemo } from 'react';
import { ApplicationStatus } from '@/constants/enums';
import { useMyApplications } from '@/modules/seeker/dashboard/hooks/use-my-applications';
import {
  deriveTrackerColumn,
  TRACKER_COLUMNS,
  type StatusMappableApplication,
} from '@/modules/seeker/applications/utils/status-map';
import type { DashboardApplicationSummary } from '@/modules/seeker/dashboard/types/applications-table.types';
import type { TrackerColumnData } from '@/modules/seeker/tracker/types/tracker.types';

/* toStatusMappable — same adapter as ApplicationsTable.tsx (kept local: tiny, single-caller each side). */
function toStatusMappable(row: DashboardApplicationSummary): StatusMappableApplication {
  return {
    status: row.status ?? ApplicationStatus.APPLIED,
    isFinalized: row.isFinalized,
    hasSubmittedForm: row.hasSubmittedForm,
    hasGenerationError: row.hasGenerationError,
    isSkipped: row.kind === 'dismissed',
    isManualEntry: row.isManualEntry,
  };
}

/*
 * useTrackerApplications
 * Groups the shared applications list (same query as the /dashboard table —
 * useMyApplications, so a status change here invalidates both) into the 5
 * tracker columns via deriveTrackerColumn. Rows that don't belong on the
 * tracker yet (in-flight, needs-you, failed, skipped) are simply absent from
 * every column, not shown anywhere on this page.
 */
export function useTrackerApplications() {
  const { data: rows, isLoading, isError, refetch } = useMyApplications();

  const columns = useMemo<TrackerColumnData[]>(() => {
    const grouped = new Map<string, DashboardApplicationSummary[]>(TRACKER_COLUMNS.map((c) => [c, []]));
    for (const row of rows ?? []) {
      const column = deriveTrackerColumn(toStatusMappable(row));
      if (column) grouped.get(column)?.push(row);
    }
    return TRACKER_COLUMNS.map((column) => ({ column, cards: grouped.get(column) ?? [] }));
  }, [rows]);

  const totalCards = useMemo(() => columns.reduce((sum, c) => sum + c.cards.length, 0), [columns]);

  return { columns, totalCards, isLoading, isError, refetch };
}
