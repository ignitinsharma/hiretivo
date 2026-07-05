'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Search, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { seekerService } from '@/services/seeker.service';
import type { SeekerSettingsData } from '@/services/seeker.service';
import type { ApplicationDefaultsInput } from '@/lib/validations/application-defaults.schema';
import { buildSubmittedFormRows } from '@/modules/seeker/apply/utils/build-submitted-form-rows';
import { useMyApplications, myApplicationsQueryKey } from '@/modules/seeker/dashboard/hooks/use-my-applications';
import {
  DASHBOARD_TABS,
  DASHBOARD_TAB_LABELS,
  DashboardTab,
  deriveDashboardTab,
  deriveTrackerColumn,
  TRACKER_COLUMN_LABELS,
  type StatusMappableApplication,
} from '@/modules/seeker/applications/utils/status-map';
import { ApplicationStatus } from '@/constants/enums';
import type { DashboardApplicationSummary } from '@/modules/seeker/dashboard/types/applications-table.types';

/*
 * toStatusMappable
 * Adapts a DashboardApplicationSummary (nullable status, `kind` discriminant)
 * into the status-map util's shape. `isSkipped` comes from `kind`, not a
 * DismissedJob-specific field; a null status defaults to APPLIED since
 * dismissed rows short-circuit on isSkipped before status is ever read.
 */
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
 * statusCellLabel
 * The Status column shows the tracker-facing label once an application is
 * finalized (submitted), "In progress" while the wizard is still running,
 * and "Passed" for a dismissed/skipped job — never the raw ApplicationStatus
 * enum, since the schema default (APPLIED) doesn't reflect reality pre-finalize.
 */
function statusCellLabel(row: DashboardApplicationSummary): string {
  if (row.kind === 'dismissed') return 'Passed';
  if (!row.isFinalized) return 'In progress';
  const column = deriveTrackerColumn(toStatusMappable(row));
  return column ? TRACKER_COLUMN_LABELS[column] : 'Submitted';
}

/*
 * ApplicationsTable
 * The /dashboard "All applications" table — every application (+ passed
 * jobs) grouped into tabs by lifecycle stage, searchable by company.
 * "Approve all" (Section D5) batch-confirms every row sitting in Needs-you —
 * rows Apply-to-all already rendered a resume for but hasn't submitted yet.
 * Builds one submittedFormData snapshot from settings + application defaults
 * and posts it to each row's finalize (no resume/coverLetter — already
 * rendered, so no re-render, no second PDF, no credit spent). Failures are
 * isolated per row.
 */
export function ApplicationsTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: rows, isLoading, isError, refetch } = useMyApplications();
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.ALL);
  const [search, setSearch] = useState('');

  const tabbed = useMemo(() => {
    const list = rows ?? [];
    return list.map((row) => ({ row, tab: deriveDashboardTab(toStatusMappable(row)) }));
  }, [rows]);

  const counts = useMemo(() => {
    const base: Record<DashboardTab, number> = {
      [DashboardTab.ALL]: tabbed.length,
      [DashboardTab.SUBMITTED]: 0,
      [DashboardTab.IN_FLIGHT]: 0,
      [DashboardTab.NEEDS_YOU]: 0,
      [DashboardTab.FAILED]: 0,
      [DashboardTab.SKIPPED]: 0,
    };
    for (const { tab } of tabbed) base[tab] += 1;
    return base;
  }, [tabbed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabbed
      .filter(({ tab }) => activeTab === DashboardTab.ALL || tab === activeTab)
      .filter(({ row }) => !q || row.companyName.toLowerCase().includes(q))
      .map(({ row }) => row);
  }, [tabbed, activeTab, search]);

  const needsYouRows = useMemo(
    () => tabbed.filter(({ tab }) => tab === DashboardTab.NEEDS_YOU).map(({ row }) => row),
    [tabbed],
  );

  const { data: settings } = useQuery<{ data: SeekerSettingsData }>({
    queryKey: ['seeker-settings'],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
    enabled: needsYouRows.length > 0,
  });
  const { data: defaultsData } = useQuery<{ data: ApplicationDefaultsInput | null }>({
    queryKey: ['seeker-application-defaults'],
    queryFn: seekerService.getApplicationDefaults,
    staleTime: 60_000,
    enabled: needsYouRows.length > 0,
  });

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      const submittedFormData = buildSubmittedFormRows(settings?.data, defaultsData?.data);
      const results = await Promise.all(
        needsYouRows.map((row) =>
          seekerService
            .finalizeApplication(row.id, { submittedFormData })
            .then(() => true)
            .catch(() => false),
        ),
      );
      return results.filter(Boolean).length;
    },
    onSuccess: (succeeded) => {
      if (succeeded > 0) void queryClient.invalidateQueries({ queryKey: myApplicationsQueryKey });
      const failed = needsYouRows.length - succeeded;
      if (failed === 0) {
        toast.success(`Submitted ${succeeded} application${succeeded === 1 ? '' : 's'}.`);
      } else {
        toast.success(`Submitted ${succeeded} of ${needsYouRows.length} applications.`);
        toast.error(`${failed} failed to submit — try again from the wizard.`);
      }
    },
    onError: () => toast.error('Could not approve applications. Try again.'),
  });

  const handleRowOpen = (row: DashboardApplicationSummary) => {
    if (row.kind !== 'application') return;
    router.push(`/dashboard/applications/${row.id}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-brand-border">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-brand-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-brand-border p-10 text-center">
        <p className="text-sm text-brand-foreground-muted">Couldn&apos;t load your applications.</p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-brand-border p-10 text-center">
        <Inbox className="h-8 w-8 text-brand-foreground-secondary" />
        <p className="text-sm font-medium text-brand-foreground">No applications yet.</p>
        <p className="text-sm text-brand-foreground-muted">Browse jobs to start applying.</p>
        <Button asChild variant="primary" size="sm">
          <a href="/dashboard/browse">Browse jobs</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DashboardTab)}>
          <TabsList className="flex-wrap">
            {DASHBOARD_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-sm">
                {DASHBOARD_TAB_LABELS[tab]} {counts[tab]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href="/dashboard/tracker">Open tracker</a>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={needsYouRows.length === 0 || approveAllMutation.isPending}
            onClick={() => approveAllMutation.mutate()}
          >
            {approveAllMutation.isPending ? 'Approving…' : 'Approve all'}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2">
        <Search className="h-4 w-4 text-brand-foreground-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-brand-foreground-secondary"
          aria-label="Search company"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full min-w-150 text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface text-left text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3">Cover letter</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Applied</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-foreground-muted">
                  No applications in this tab.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleRowOpen(row)}
                  className={
                    'border-b border-brand-border last:border-0 ' +
                    (row.kind === 'application' ? 'cursor-pointer hover:bg-brand-surface' : 'opacity-70')
                  }
                >
                  <td className="max-w-60 truncate px-4 py-3 font-medium text-brand-foreground">
                    {row.companyName}
                    <span className="block truncate text-xs font-normal text-brand-foreground-muted">
                      {row.jobTitle}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-foreground-muted">{row.isFinalized ? 'Ready' : 'Off'}</td>
                  <td className="px-4 py-3 text-brand-foreground-muted">
                    {row.hasCoverLetter ? 'Ready' : 'Off'}
                  </td>
                  <td className="px-4 py-3 text-brand-foreground">{statusCellLabel(row)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-foreground-muted">
                    {format(new Date(row.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
