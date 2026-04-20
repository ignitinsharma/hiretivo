'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { ActiveJobsList } from '@/modules/recruiter/dashboard/components/ActiveJobsList';
import { RecentApplicantsList } from '@/modules/recruiter/dashboard/components/RecentApplicantsList';
import { ApplicationTrendChart } from '@/modules/recruiter/dashboard/components/ApplicationTrendChart';
import { DashboardSkeleton } from '@/modules/recruiter/dashboard/components/DashboardSkeleton';
import { ApplicationStatus } from '@/constants/enums';
import type { RecentApplicant } from '@/modules/recruiter/dashboard/types/dashboard.types';
import { cn } from '@/lib/utils';

interface DashboardStats {
  activeJobsCount: number;
  totalApplications: number;
  newThisWeek: number;
  avgMatchScore: number;
}

interface DashboardStatItem {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary';
  /** Numeric value for progress bars (0-100) */
  numericValue?: number;
}

function getStatsItems(stats: DashboardStats): DashboardStatItem[] {
  return [
    { label: 'Active Jobs', value: stats.activeJobsCount },
    { label: 'Total Applications', value: stats.totalApplications },
    { label: 'New This Week', value: stats.newThisWeek, variant: 'primary' },
    { label: 'Avg. Match Score', value: `${Math.round(stats.avgMatchScore)}%`, numericValue: stats.avgMatchScore },
  ];
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
        {stat.label === 'Avg. Match Score' && (
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden self-center">
            <div
              className="bg-primary h-full"
              style={{ width: `${Math.min(stat.numericValue ?? 0, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function RecruiterDashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? 'Recruiter';

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/recruiter/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = (await res.json()) as { data: {
        activeJobsCount: number;
        totalApplications: number;
        newThisWeek: number;
        avgMatchScore: number;
        recentApplicants: Array<{
          id: string;
          seekerName: string;
          seekerImage: string | null;
          jobTitle: string;
          matchScore: number;
          status: string;
          appliedDate: string;
        }>;
        trendData: Array<{ date: string; count: number }>;
      } };
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats: DashboardStats = {
    activeJobsCount: data?.activeJobsCount ?? 0,
    totalApplications: data?.totalApplications ?? 0,
    newThisWeek: data?.newThisWeek ?? 0,
    avgMatchScore: data?.avgMatchScore ?? 0,
  };

  const statItems = getStatsItems(stats);

  const typedApplicants: RecentApplicant[] = (data?.recentApplicants ?? []).map(
    (app) => ({
      ...app,
      status: app.status as ApplicationStatus,
    }),
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-8 space-y-10">
        {/* Header */}
        <section className="flex items-start gap-4">
          <SidebarToggle className="mt-2" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              {getGreeting()}, {userName.split(' ')[0]}.
            </h1>
            <p className="text-slate-500 text-lg">
              Here&apos;s what&apos;s happening with your recruitment pipeline
              today.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </section>

        {/* Jobs + Applicants Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <ActiveJobsList />
          </div>
          <div className="lg:col-span-2">
            <RecentApplicantsList applicants={typedApplicants} />
          </div>
        </section>

        {/* Application Trend */}
        <ApplicationTrendChart />
      </div>
    </div>
  );
}
