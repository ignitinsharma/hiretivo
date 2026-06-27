'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/axios';

/*
 * fetchAtsPauseState
 * Fetches current ATS import pause state from the admin API.
 * @returns { paused: boolean }
 */
async function fetchAtsPauseState(): Promise<{ paused: boolean }> {
  const { data } = await apiClient.get<{ paused: boolean }>('/admin/ats/pause');
  return data;
}

/*
 * setAtsPauseState
 * Posts the desired pause state to the admin API.
 * @param paused - true to pause, false to resume
 * @returns { paused: boolean } reflecting the new state
 */
async function setAtsPauseState(paused: boolean): Promise<{ paused: boolean }> {
  const { data } = await apiClient.post<{ paused: boolean }>('/admin/ats/pause', { paused });
  return data;
}

/*
 * AtsPauseToggle
 * Admin control to pause or resume automated ATS job imports.
 * Uses TanStack Query for fetching state (useQuery) and toggling (useMutation).
 * Invalidates the ats-pause-state cache on successful toggle so the UI
 * reflects the confirmed server value rather than an optimistic guess.
 */
export function AtsPauseToggle() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ats-pause-state'],
    queryFn: fetchAtsPauseState,
    staleTime: 30 * 1000,
  });

  const paused = data?.paused ?? null;

  const toggleMutation = useMutation({
    mutationFn: (next: boolean) => setAtsPauseState(next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ats-pause-state'] });
    },
  });

  /*
   * handleToggle
   * Fires the toggle mutation with the opposite of the current pause state.
   * No-ops when the state is not yet loaded. Side effect: on success the
   * ats-pause-state query is invalidated so the badge re-fetches from the server.
   */
  function handleToggle() {
    if (paused === null) return;
    toggleMutation.mutate(!paused);
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-xl tracking-tight text-brand-foreground">
            ATS Import
          </h3>
          <p className="mt-1 text-sm text-brand-foreground-muted">
            {isLoading
              ? 'Loading status...'
              : paused
              ? 'Import is paused. Cron runs will skip fetch and auto-close.'
              : 'Import is active. Jobs fetch daily at midnight UTC.'}
          </p>
          {(isError || toggleMutation.isError) && (
            <p className="mt-1 text-sm text-brand-danger">
              {toggleMutation.isError
                ? (toggleMutation.error instanceof Error
                    ? toggleMutation.error.message
                    : 'Failed to update')
                : 'Failed to load import status'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium border ${
            isLoading
              ? 'border-brand-border bg-brand-surface text-brand-foreground-muted'
              : paused
              ? 'border-brand-border bg-brand-surface text-brand-danger'
              : 'border-brand-border bg-brand-surface text-brand-success'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              isLoading
                ? 'bg-brand-foreground-secondary'
                : paused
                ? 'bg-brand-danger'
                : 'bg-brand-success'
            }`} />
            {isLoading ? 'Loading' : paused ? 'Paused' : 'Active'}
          </span>
          <Button
            variant={paused ? 'primary' : 'destructive'}
            onClick={handleToggle}
            disabled={isLoading || toggleMutation.isPending || paused === null}
          >
            {toggleMutation.isPending ? 'Updating...' : paused ? 'Resume Import' : 'Pause Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
