'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecruiterAnalytics } from '@/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics';
import type { FunnelStage } from '@/modules/recruiter/analytics/types/analytics.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD = 'bg-white rounded-xl border border-brand-border p-5';

// ─── Sub-components ──────────────────────────────────────────────────────────

/*
 * FunnelCard
 * Renders a single hiring funnel stage as a metric card.
 * Shows the stage label, count (large text), and conversion % badge.
 * conversionPct is null for the first stage or when the previous stage count is 0.
 */
function FunnelCard({ stage }: { stage: FunnelStage }) {
  const badge = stage.conversionPct === null ? '—' : `${stage.conversionPct}%`;
  return (
    <div className={CARD}>
      <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted mb-2">
        {stage.label}
      </p>
      <p className="text-2xl font-bold text-brand-foreground">{stage.count}</p>
      <span className="mt-2 inline-block rounded-lg bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-foreground-muted">
        {badge}
      </span>
    </div>
  );
}

/*
 * FunnelSkeleton
 * Animated loading skeleton for the 6-stage funnel grid.
 */
function FunnelSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${CARD} animate-pulse`}>
          <div className="h-3 w-16 rounded bg-brand-surface mb-3" />
          <div className="h-7 w-10 rounded bg-brand-surface" />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  isFreePlan: boolean;
}

/*
 * AnalyticsTab
 * Analytics tab for /recruiter/pipeline.
 * Renders the hiring funnel (6 stages with count + conversion % badge),
 * credits used vs quota remaining, and top 5 skill chips.
 * FREE plan: shows a locked overlay and does NOT fire the analytics fetch.
 * @param isFreePlan - true when the recruiter is on PlanTier.FREE (computed server-side)
 */
export function AnalyticsTab({ isFreePlan }: AnalyticsTabProps) {
  // FREE plan: return overlay immediately — hook must not be called
  if (isFreePlan) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-brand-foreground-muted mb-4" />
        <p className="font-semibold text-brand-foreground">Analytics requires a paid plan</p>
        <p className="mt-2 text-sm text-brand-foreground-muted">
          Upgrade to STARTER, GROWTH, or SCALE to see your hiring funnel and ROI.
        </p>
        <Button asChild variant="primary" className="mt-6">
          <a href="/pricing">View Plans</a>
        </Button>
      </div>
    );
  }

  return <AnalyticsTabContent />;
}

/*
 * AnalyticsTabContent
 * Inner component rendered only for paid plans.
 * Calls useRecruiterAnalytics and handles isLoading, isError, and empty states.
 * Separated from AnalyticsTab so the hook is never invoked for FREE plans.
 */
function AnalyticsTabContent() {
  const { data, isLoading, isError, refetch } = useRecruiterAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <FunnelSkeleton />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`${CARD} animate-pulse h-24`} />
          <div className={`${CARD} animate-pulse h-24`} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center">
        <p className="font-medium text-brand-danger">Failed to load analytics</p>
        <p className="mt-1 text-sm text-brand-foreground-muted">Something went wrong fetching your analytics data.</p>
        <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center">
        <p className="text-brand-foreground-muted text-sm">No analytics data available yet.</p>
      </div>
    );
  }

  // ── Quota label ─────────────────────────────────────────────────────────────
  const quotaLabel =
    data.totalQuota === null
      ? 'Unlimited'
      : `${data.creditsRemaining} of ${data.totalQuota} remaining`;

  return (
    <div className="flex flex-col gap-6">
      {/* Funnel section (ANLT-02) */}
      <section>
        <h2 className="font-semibold text-xl leading-snug tracking-tight text-brand-foreground mb-4">
          Hiring Funnel
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {data.funnel.map((stage) => (
            <FunnelCard key={stage.key} stage={stage} />
          ))}
        </div>
      </section>

      {/* Credits section (ANLT-04) */}
      <section>
        <h2 className="font-semibold text-xl leading-snug tracking-tight text-brand-foreground mb-4">
          Credits
        </h2>
        <div className={CARD}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
                Credits Used
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">{data.creditsUsed}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
                Quota
              </p>
              <p className="mt-1 text-base font-semibold text-brand-foreground">{quotaLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Skills section (ANLT-05) */}
      <section>
        <h2 className="font-semibold text-xl leading-snug tracking-tight text-brand-foreground mb-4">
          Top Skills
        </h2>
        <div className={CARD}>
          {data.topSkills.length === 0 ? (
            <p className="text-sm text-brand-foreground-muted">No unlocked engineers yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.topSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-brand-surface px-3 py-1 text-sm font-medium text-brand-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
