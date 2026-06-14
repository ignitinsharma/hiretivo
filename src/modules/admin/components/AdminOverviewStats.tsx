import {
  Users,
  Building2,
  Briefcase,
  LayoutGrid,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  VerificationStatus,
  PlanTier,
  PLAN_TIER_VALUES,
} from "@/constants/enums";
import type { OverviewStats } from "@/modules/admin/utils/get-overview-stats";
import {
  VERIFICATION_STATUS_DISPLAY,
  PLAN_TIER_DISPLAY,
} from "@/modules/admin/utils/status-display";
import { AdminBadge } from "@/modules/admin/components/AdminBadge";

interface AdminOverviewStatsProps {
  stats: OverviewStats;
}

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Icon-chip tint (border + bg + text); borders/tints only, no shadow. */
  accent: string;
}

/** Repeated stat-card base className. */
const CARD_BASE = "rounded-xl border border-brand-border bg-white p-5";

/*
 * AdminOverviewStats
 * Admin dashboard stat grid. Renders eight platform-total cards (each with a
 * tinted Lucide icon chip) plus candidate-by-status and company-by-plan
 * breakdown panels using human-readable labels and semantic colored badges.
 * All sections use DRY .map over data arrays. Borders/tints only — no shadow,
 * no dark mode — per project styling rules.
 *
 * @param stats - Aggregate stats from the shared getOverviewStats builder.
 */
export function AdminOverviewStats({ stats }: AdminOverviewStatsProps) {
  const TOTALS: StatCard[] = [
    {
      label: "Total seekers",
      value: stats.totalSeekers,
      icon: Users,
      accent: "border-blue-100 bg-blue-50 text-blue-600",
    },
    {
      label: "Total companies",
      value: stats.totalCompanies,
      icon: Building2,
      accent: "border-brand-primary/15 bg-brand-primary/10 text-brand-primary",
    },
    {
      label: "Open jobs",
      value: stats.openJobs,
      icon: Briefcase,
      accent: "border-emerald-100 bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total jobs",
      value: stats.totalJobs,
      icon: LayoutGrid,
      accent: "border-amber-100 bg-amber-50 text-amber-600",
    },
    {
      label: "New seekers (7d)",
      value: stats.signups7.seekers,
      icon: UserPlus,
      accent: "border-blue-100 bg-blue-50 text-blue-600",
    },
    {
      label: "New companies (7d)",
      value: stats.signups7.companies,
      icon: TrendingUp,
      accent: "border-brand-primary/15 bg-brand-primary/10 text-brand-primary",
    },
    {
      label: "New seekers (30d)",
      value: stats.signups30.seekers,
      icon: UserPlus,
      accent: "border-blue-100 bg-blue-50 text-blue-600",
    },
    {
      label: "New companies (30d)",
      value: stats.signups30.companies,
      icon: TrendingUp,
      accent: "border-brand-primary/15 bg-brand-primary/10 text-brand-primary",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOTALS.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className={CARD_BASE}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brand-foreground-muted">
                    {t.label}
                  </p>
                  <p className="mt-2 font-bold text-3xl tracking-tight text-brand-foreground">
                    {t.value}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${t.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-white p-5">
          <h2 className="font-semibold text-lg text-brand-foreground">
            Candidates by status
          </h2>
          <div className="mt-4 divide-y divide-brand-border">
            {Object.values(VerificationStatus).map((status) => {
              const display = VERIFICATION_STATUS_DISPLAY[status];
              return (
                <div
                  key={status}
                  className="flex items-center justify-between py-2.5"
                >
                  <AdminBadge label={display.label} className={display.badge} />
                  <span className="font-semibold text-sm text-brand-foreground">
                    {stats.candidatesByStatus[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-5">
          <h2 className="font-semibold text-lg text-brand-foreground">
            Companies by plan
          </h2>
          <div className="mt-4 divide-y divide-brand-border">
            {PLAN_TIER_VALUES.map((tier) => {
              const display = PLAN_TIER_DISPLAY[tier];
              return (
                <div
                  key={tier}
                  className="flex items-center justify-between py-2.5"
                >
                  <AdminBadge label={display.label} className={display.badge} />
                  <span className="font-semibold text-sm text-brand-foreground">
                    {stats.companiesByPlan[tier]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
