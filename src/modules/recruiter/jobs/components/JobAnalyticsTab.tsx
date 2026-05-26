'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useFetchAnalytics } from '@/modules/recruiter/jobs/queries/use-fetch-analytics';
import type { JobAnalyticsResponse } from '@/modules/recruiter/jobs/types/analytics.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetricCardConfig {
  label: string;
  getValue: (data: JobAnalyticsResponse) => string;
}

interface MetricCardProps {
  config: MetricCardConfig;
  data: JobAnalyticsResponse;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const METRIC_CARD_CONFIGS: MetricCardConfig[] = [
  { label: 'Total Views', getValue: (d) => d.viewCount.toLocaleString() },
  { label: 'Apply Rate', getValue: (d) => `${d.applyRate.toFixed(1)}%` },
  { label: 'Avg Match Score', getValue: (d) => `${Math.round(d.avgMatchScore)}%` },
  { label: 'Top Skills', getValue: (d) => d.topSkills.slice(0, 3).join(', ') || 'No data' },
];

const CARD_BASE = 'bg-white rounded-xl border border-slate-200 p-5';

const CHART_CONFIG = {
  views: { label: 'Views', color: 'hsl(var(--chart-1))' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ config, data }: MetricCardProps) {
  return (
    <div className={CARD_BASE}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        {config.label}
      </p>
      <p className="text-2xl font-extrabold text-slate-900 truncate">
        {config.getValue(data)}
      </p>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className={cn(CARD_BASE, 'animate-pulse')}>
      <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
      <div className="h-7 w-28 bg-slate-200 rounded" />
    </div>
  );
}

function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700 mb-3">Failed to load analytics</p>
      <button
        onClick={onRetry}
        className="text-xs font-bold text-red-600 underline underline-offset-2 hover:text-red-800"
      >
        Retry
      </button>
    </div>
  );
}

function ViewTrendChart({ data }: { data: JobAnalyticsResponse }) {
  return (
    <div className={cn(CARD_BASE, 'mt-6')}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        30-Day View Trend
      </p>
      <ChartContainer config={CHART_CONFIG} className="h-48 w-full">
        <BarChart data={data.viewTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: string) => val.slice(5)}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="views" fill="var(--color-views)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface JobAnalyticsTabProps {
  jobId: string;
}

export function JobAnalyticsTab({ jobId }: JobAnalyticsTabProps) {
  const { data, isLoading, isError, refetch } = useFetchAnalytics(jobId);

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRIC_CARD_CONFIGS.map((c) => (
            <MetricCardSkeleton key={c.label} />
          ))}
        </div>
        <div className={cn(CARD_BASE, 'mt-6 h-56 animate-pulse')}>
          <div className="h-3 w-32 bg-slate-200 rounded mb-4" />
          <div className="h-40 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-6">
        <AnalyticsError onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRIC_CARD_CONFIGS.map((config) => (
          <MetricCard key={config.label} config={config} data={data} />
        ))}
      </div>
      <ViewTrendChart data={data} />
    </div>
  );
}
