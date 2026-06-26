'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, X, RefreshCw } from 'lucide-react';

interface BlocklistEntry {
  id: string;
  companyName: string;
  domain: string | null;
  reason: string | null;
  blockedAt: string;
  blockedBy: string | null;
}

interface AtsStats {
  activeAtsJobs: number;
  companiesWatched: number;
  blockedCount: number;
  lastFetchAt: string | null;
}

export function AtsBlocklistSection() {
  const [entries, setEntries] = useState<BlocklistEntry[]>([]);
  const [stats, setStats] = useState<AtsStats | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [blocklistRes, statsRes] = await Promise.all([
        fetch('/api/admin/ats/blocklist'),
        fetch('/api/admin/ats/stats'),
      ]);
      const blocklistData = await blocklistRes.json();
      const statsData = await statsRes.json();
      setEntries(blocklistData.blocklist ?? []);
      setStats(statsData);
    } catch (err) {
      console.error('[AtsBlocklistSection] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!companyName.trim()) return;
    try {
      await fetch('/api/admin/ats/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), reason: reason.trim() || null }),
      });
      setCompanyName('');
      setReason('');
      await fetchData();
    } catch (err) {
      console.error('[AtsBlocklistSection] add error:', err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/admin/ats/blocklist/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error('[AtsBlocklistSection] remove error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-brand-foreground-muted">Active ATS Jobs</p>
            <p className="mt-2 font-bold text-3xl tracking-tight text-brand-foreground">{stats.activeAtsJobs}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-brand-foreground-muted">Companies Watched</p>
            <p className="mt-2 font-bold text-3xl tracking-tight text-brand-foreground">{stats.companiesWatched}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-brand-foreground-muted">Blocked Companies</p>
            <p className="mt-2 font-bold text-3xl tracking-tight text-brand-foreground">{stats.blockedCount}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-brand-foreground-muted">Last Fetch</p>
            <p className="mt-2 font-bold text-sm tracking-tight text-brand-foreground">
              {stats.lastFetchAt ? new Date(stats.lastFetchAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-brand-border bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold text-lg text-brand-foreground">
          <Shield className="h-5 w-5" />
          Blocked Companies
        </h2>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
          >
            <Plus className="h-4 w-4" /> Block
          </button>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-brand-foreground-muted" />
          </div>
        ) : entries.length === 0 ? (
          <p className="mt-4 text-sm text-brand-foreground-muted">No blocked companies.</p>
        ) : (
          <div className="mt-4 divide-y divide-brand-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-brand-foreground">{entry.companyName}</p>
                  {entry.reason && (
                    <p className="text-xs text-brand-foreground-muted">{entry.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="rounded-lg p-1.5 text-brand-foreground-muted hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
