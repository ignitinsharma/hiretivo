'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { PipelineStage } from '@/constants/enums';
import type { ApplicationInsights as ApplicationInsightsData } from '@/lib/application-insights';

const LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NOT_APPLIED]: 'Not applied',
  [PipelineStage.APPLIED]: 'Applied',
  [PipelineStage.INTERVIEWING]: 'Interviewing',
  [PipelineStage.OFFER]: 'Offer',
  [PipelineStage.REJECTED]: 'Rejected',
};

/** Dashboard summaries and charts with numeric tables for every value shown. */
export function ApplicationInsights() {
  const [weeks, setWeeks] = useState(4);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['application-insights', weeks],
    queryFn: async (): Promise<ApplicationInsightsData> => {
      const response = await fetch(`/api/seeker/application-insights?weeks=${weeks}`);
      if (!response.ok) throw new Error('Could not load application activity');
      const result: { data: ApplicationInsightsData } = await response.json();
      return result.data;
    },
  });

  if (isLoading) return <p className="text-sm text-brand-foreground-muted" role="status">Loading application activity…</p>;
  if (isError || !data) return <p className="text-sm text-brand-danger" role="alert">Could not load application activity. Try refreshing the page.</p>;

  return (
    <section className="space-y-5" aria-labelledby="activity-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="activity-heading" className="text-2xl font-bold tracking-tight text-brand-foreground">Application activity</h1>
          <p className="mt-1 text-sm text-brand-foreground-muted">Progress across {data.total} saved {data.total === 1 ? 'application' : 'applications'}.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-foreground-muted">
          Activity period
          <select value={weeks} onChange={(event) => setWeeks(Number(event.target.value))} className="rounded-lg border border-brand-border bg-white px-3 py-2 text-brand-foreground" aria-label="Activity period">
            {[4, 8, 12].map((value) => <option key={value} value={value}>Last {value} weeks</option>)}
          </select>
        </label>
      </div>

      {data.total === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-6">
          <h2 className="font-semibold text-brand-foreground">No applications yet</h2>
          <p className="mt-1 text-sm text-brand-foreground-muted">Add a job in the tracker to start seeing your progress here.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <h2 className="text-lg font-semibold text-brand-foreground">Application funnel</h2>
            <p className="mt-1 text-sm text-brand-foreground-muted">Each application counts at every stage it reached, even after rejection.</p>
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Application funnel counts</caption>
              <thead className="sr-only"><tr><th scope="col">Stage</th><th scope="col">Applications</th><th scope="col">Progress</th></tr></thead>
              <tbody>{data.funnel.map(({ stage, count }) => (
                <tr key={stage} className="border-t border-brand-border">
                  <th scope="row" className="py-3 text-left font-medium text-brand-foreground">{LABELS[stage]}</th>
                  <td className="w-10 py-3 text-right font-semibold tabular-nums text-brand-foreground">{count}</td>
                  <td className="w-1/3 py-3 pl-3"><meter className="w-full accent-brand-primary" min={0} max={Math.max(data.total, 1)} value={count} aria-label={`${LABELS[stage]} progress`} /></td>
                </tr>
              ))}</tbody>
            </table>
            <p className="mt-4 text-xs text-brand-foreground-muted">Current status: {data.statuses.map(({ stage, count }) => `${LABELS[stage]} ${count}`).join(' · ')}</p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5">
            <h2 className="text-lg font-semibold text-brand-foreground">Week by week</h2>
            <p className="mt-1 text-sm text-brand-foreground-muted">Applications saved each week, starting Monday.</p>
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Weekly saved application counts</caption>
              <thead className="sr-only"><tr><th scope="col">Week starting</th><th scope="col">Applications</th><th scope="col">Activity</th></tr></thead>
              <tbody>{data.weeks.map(({ startsOn, count }) => (
                <tr key={startsOn} className="border-t border-brand-border">
                  <th scope="row" className="py-3 text-left font-medium text-brand-foreground">{format(parseISO(startsOn), 'MMM d, yyyy')}</th>
                  <td className="w-10 py-3 text-right font-semibold tabular-nums text-brand-foreground">{count}</td>
                  <td className="w-1/3 py-3 pl-3"><meter className="w-full accent-brand-primary" min={0} max={Math.max(...data.weeks.map((week) => week.count), 1)} value={count} aria-label={`${startsOn} activity`} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
