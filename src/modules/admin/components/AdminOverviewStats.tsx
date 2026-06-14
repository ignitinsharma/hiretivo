import {
  VerificationStatus,
  PlanTier,
  PLAN_TIER_VALUES,
} from "@/constants/enums";
import type { OverviewStats } from "@/modules/admin/utils/get-overview-stats";

interface AdminOverviewStatsProps {
  stats: OverviewStats;
}

/** Repeated stat-card base className. */
const CARD_BASE = "rounded-xl border border-brand-border bg-white p-6";

/** Brand-token chip for breakdown rows. */
const CHIP_BASE =
  "rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-foreground";

/*
 * AdminOverviewStats
 * Presentational server component for the admin dashboard. Renders a platform-totals
 * card grid plus candidate-by-status and company-by-plan breakdowns. All sections use
 * DRY .map over data arrays (no copy-pasted cards). Consumes the shared OverviewStats
 * contract from getOverviewStats.
 *
 * @param stats - Aggregate stats from the shared builder.
 */
export function AdminOverviewStats({ stats }: AdminOverviewStatsProps) {
  const TOTALS = [
    { label: "Total seekers", value: stats.totalSeekers },
    { label: "Total companies", value: stats.totalCompanies },
    { label: "Open jobs", value: stats.openJobs },
    { label: "Total jobs", value: stats.totalJobs },
    { label: "New seekers (7d)", value: stats.signups7.seekers },
    { label: "New companies (7d)", value: stats.signups7.companies },
    { label: "New seekers (30d)", value: stats.signups30.seekers },
    { label: "New companies (30d)", value: stats.signups30.companies },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOTALS.map((t) => (
          <div key={t.label} className={CARD_BASE}>
            <p className="text-xs uppercase tracking-wider text-brand-foreground-muted">
              {t.label}
            </p>
            <p className="font-bold text-2xl text-brand-foreground mt-1">
              {t.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-xl text-brand-foreground">
          Candidates by status
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(VerificationStatus).map((status) => (
            <div key={status} className={CHIP_BASE}>
              <span className="font-medium">{status}</span>:{" "}
              {stats.candidatesByStatus[status]}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-xl text-brand-foreground">
          Companies by plan
        </h2>
        <div className="flex flex-wrap gap-2">
          {PLAN_TIER_VALUES.map((tier) => (
            <div key={tier} className={CHIP_BASE}>
              <span className="font-medium">{tier}</span>:{" "}
              {stats.companiesByPlan[tier]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
