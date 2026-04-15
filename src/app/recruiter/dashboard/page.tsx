'use client';

import { useEffect, useState } from 'react';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { ActiveJobsList } from '@/modules/recruiter/dashboard/components/ActiveJobsList';
import { RecentApplicantsList } from '@/modules/recruiter/dashboard/components/RecentApplicantsList';
import { ApplicationTrendChart } from '@/modules/recruiter/dashboard/components/ApplicationTrendChart';
import { cn } from '@/lib/utils';

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  newThisWeek: number;
  avgMatchScore: number;
}

interface DashboardStatItem {
  label: string;
  value: string | number;
  trend?: string;
  variant?: 'default' | 'primary';
}

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
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {stat.trend}
          </span>
        )}
        {stat.label === 'Avg. Match Score' && typeof stat.value === 'number' && (
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden self-center">
            <div className="bg-primary h-full" style={{ width: `${stat.value}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-24 mb-4" />
      <div className="h-8 bg-slate-100 rounded w-16" />
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiter/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard');
        return res.json();
      })
      .then((data) => {
        setStats(data.stats ?? null);
      })
      .catch(() => {
        setStats(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const dashboardStats: DashboardStatItem[] = stats
    ? [
        { label: 'Active Jobs', value: stats.activeJobs },
        { label: 'Total Applications', value: stats.totalApplications },
        { label: 'New This Week', value: stats.newThisWeek, variant: 'primary' },
        { label: 'Avg. Match Score', value: stats.avgMatchScore ? `${stats.avgMatchScore}%` : 'N/A' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-8 space-y-10">
        <section className="flex items-start gap-4">
          <SidebarToggle className="mt-2" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500 text-lg">
              Here&apos;s what&apos;s happening with your recruitment pipeline
              today.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            dashboardStats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <ActiveJobsList />
          </div>
          <div className="lg:col-span-2">
            <RecentApplicantsList />
          </div>
        </section>

        <ApplicationTrendChart />
      </div>
    </div>
  );
}