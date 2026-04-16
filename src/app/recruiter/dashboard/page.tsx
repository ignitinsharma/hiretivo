'use client';

import { useSession } from 'next-auth/react';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { ActiveJobsList } from '@/modules/recruiter/dashboard/components/ActiveJobsList';
import { RecentApplicantsList } from '@/modules/recruiter/dashboard/components/RecentApplicantsList';
import { ApplicationTrendChart } from '@/modules/recruiter/dashboard/components/ApplicationTrendChart';
import { DashboardStats } from '@/modules/recruiter/dashboard/components/DashboardStats';
import { DashboardSkeleton } from '@/modules/recruiter/dashboard/components/DashboardSkeleton';
import { useFetchRecruiterDashboard } from '@/modules/recruiter/dashboard/hooks/use-fetch-recruiter-dashboard';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function RecruiterDashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading, isError, refetch } = useFetchRecruiterDashboard();

  const displayName = session?.user?.name?.split(' ')[0] ?? 'there';

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-500">Failed to load dashboard data.</p>
          <button
            onClick={() => refetch()}
            className="text-primary font-semibold hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-8 space-y-10">
        <section className="flex items-start gap-4">
          <SidebarToggle className="mt-2" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              {getGreeting()}, {displayName}.
            </h1>
            <p className="text-slate-500 text-lg">
              Here&apos;s what&apos;s happening with your recruitment pipeline
              today.
            </p>
          </div>
        </section>

        <DashboardStats stats={data.stats} />

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <ActiveJobsList />
          </div>
          <div className="lg:col-span-2">
            <RecentApplicantsList applicants={data.recentApplicants} />
          </div>
        </section>

        <ApplicationTrendChart trendData={data.trendData} />
      </div>
    </div>
  );
}