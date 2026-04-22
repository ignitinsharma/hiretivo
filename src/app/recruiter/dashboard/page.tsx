'use client';

import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { ActiveJobsList } from '@/modules/recruiter/dashboard/components/ActiveJobsList';
import { RecentApplicantsList } from '@/modules/recruiter/dashboard/components/RecentApplicantsList';
import { ApplicationTrendChart } from '@/modules/recruiter/dashboard/components/ApplicationTrendChart';
import { RECRUITER_STATS, RECENT_APPLICANTS } from '@/modules/recruiter/dashboard/data/mock-dashboard-data';
import { cn } from '@/lib/utils';

interface DashboardStatItem {
  label: string;
  value: string | number;
  trend?: string;
  variant?: 'default' | 'primary';
}

const DASHBOARD_STATS: DashboardStatItem[] = [
  {
    label: 'Active Jobs',
    value: RECRUITER_STATS.activeJobs,
    trend: '+5%',
  },
  {
    label: 'Total Applications',
    value: 482,
  },
  {
    label: 'New This Week',
    value: 28,
    variant: 'primary',
  },
  {
    label: 'Avg. Match Score',
    value: '78%',
  },
];

function StatCard({ stat }: { stat: DashboardStatItem }) {
  const isPrimary = stat.variant === 'primary';
  return (
    <div
      className={cn(
        'p-6 rounded-xl',
        isPrimary
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'bg-white border border-slate-200 shadow-sm'
      )}
    >
      <p
        className={cn(
          'text-sm font-medium mb-4',
          isPrimary ? 'opacity-80' : 'text-slate-500'
        )}
      >
        {stat.label}
      </p>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{stat.value}</span>
        {stat.trend && (
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {stat.trend}
          </span>
        )}
        {stat.label === 'Avg. Match Score' && (
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden self-center">
            <div className="bg-primary h-full w-[78%]" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-8 space-y-10">
        {/* Header */}
        <section className="flex items-start gap-4">
          <SidebarToggle className="mt-2" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Good morning, Nitin.
            </h1>
            <p className="text-slate-500 text-lg">
              Here&apos;s what&apos;s happening with your recruitment pipeline
              today.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DASHBOARD_STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </section>

        {/* Jobs + Applicants Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <ActiveJobsList />
          </div>
          <div className="lg:col-span-2">
            <RecentApplicantsList applicants={RECENT_APPLICANTS} />
          </div>
        </section>

        {/* Application Trend */}
        <ApplicationTrendChart />
      </div>
    </div>
  );
}
