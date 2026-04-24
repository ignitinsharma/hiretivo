import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/modules/recruiter/dashboard/types/dashboard.types';

interface DashboardStatItem {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary';
}

const CARD_BASE = 'p-6 rounded-xl';

function getStatsItems(stats: DashboardStats): DashboardStatItem[] {
  return [
    { label: 'Active Jobs', value: stats.activeJobsCount },
    { label: 'Total Applications', value: stats.totalApplications },
    { label: 'New This Week', value: stats.newThisWeek, variant: 'primary' },
    { label: 'Avg. Match Score', value: `${Math.round(stats.avgMatchScore)}%` },
  ];
}

function StatCard({ stat }: { stat: DashboardStatItem }) {
  const isPrimary = stat.variant === 'primary';
  return (
    <div
      className={cn(
        CARD_BASE,
        isPrimary
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'bg-white border border-slate-200 shadow-sm'
      )}
    >
      <p
        className={cn(
          'text-sm font-medium mb-4',
          isPrimary ? 'opacity-60' : 'text-slate-500'
        )}
      >
        {stat.label}
      </p>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{stat.value}</span>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const items = getStatsItems(stats);
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </section>
  );
}