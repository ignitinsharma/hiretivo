'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/*
 * AtsPauseToggle
 * Admin control to pause or resume automated ATS job imports.
 * Reads current state on mount; toggles via POST /api/admin/ats/pause.
 */
export function AtsPauseToggle() {
  const [paused, setPaused] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/ats/pause')
      .then((r) => r.json())
      .then((data) => setPaused(data.paused))
      .catch(() => setError('Failed to load import status'))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    if (paused === null) return;
    setToggling(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ats/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: !paused }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update');
      setPaused(data.paused);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-xl tracking-tight text-brand-foreground">
            ATS Import
          </h3>
          <p className="mt-1 text-sm text-brand-foreground-muted">
            {loading
              ? 'Loading status...'
              : paused
              ? 'Import is paused. Cron runs will skip fetch and auto-close.'
              : 'Import is active. Jobs fetch daily at midnight UTC.'}
          </p>
          {error && (
            <p className="mt-1 text-sm text-brand-danger">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium border ${
            loading
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : paused
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-gray-300' : paused ? 'bg-red-500' : 'bg-green-500'}`} />
            {loading ? 'Loading' : paused ? 'Paused' : 'Active'}
          </span>
          <Button
            variant={paused ? 'primary' : 'destructive'}
            onClick={handleToggle}
            disabled={loading || toggling || paused === null}
          >
            {toggling ? 'Updating...' : paused ? 'Resume Import' : 'Pause Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
