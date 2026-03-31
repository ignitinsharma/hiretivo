import React from 'react';
import { RecommendedJobsList } from '@/modules/seeker/dashboard/components/RecommendedJobsList';
import { ProfileStrengthCard } from '@/modules/seeker/dashboard/components/ProfileStrengthCard';
import { QuickStatsCard } from '@/modules/seeker/dashboard/components/QuickStatsCard';
import { JobAlertsPromo } from '@/modules/seeker/dashboard/components/JobAlertsPromo';

export default function SeekerDashboardPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Welcome back, Nitin!
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Your personalized job market is heating up today.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Column: Recommended Jobs */}
        <RecommendedJobsList />

        {/* Right Sidebar Column */}
        <aside className="w-full lg:w-80 space-y-6 shrink-0">
          <ProfileStrengthCard />
          <QuickStatsCard />
          <JobAlertsPromo />
        </aside>
      </div>
    </>
  );
}