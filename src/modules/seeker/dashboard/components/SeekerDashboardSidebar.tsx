'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileStrengthCard } from './ProfileStrengthCard';
import { QuickStatsCard } from './QuickStatsCard';
import { JobAlertsPromo } from './JobAlertsPromo';
import type { SeekerDashboardData } from '../types/dashboard.types';

interface DashboardApiResponse {
  data: SeekerDashboardData;
}

async function fetchDashboardSummary(): Promise<SeekerDashboardData> {
  const res = await fetch('/api/seeker/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  const json = (await res.json()) as DashboardApiResponse;
  return json.data;
}

async function patchDigest(enabled: boolean): Promise<void> {
  const res = await fetch('/api/seeker/digest', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error('Failed to update digest preference');
}

const QUERY_KEY = ['seeker-dashboard-summary'] as const;

function SidebarSkeleton() {
  return (
    <div className="w-full lg:w-80 space-y-6 shrink-0">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-2 w-full rounded-full mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Skeleton className="h-5 w-32 mb-6" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-8" />
          </div>
        ))}
      </div>
      <div className="bg-primary/10 p-6 rounded-xl">
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </div>
  );
}

export function SeekerDashboardSidebar() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDashboardSummary,
    staleTime: 60_000,
  });

  const digestMutation = useMutation({
    mutationFn: patchDigest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  if (isLoading) return <SidebarSkeleton />;

  if (isError || !data) {
    return (
      <aside className="w-full lg:w-80 space-y-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm text-slate-500 text-center">
          Could not load dashboard data.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-80 space-y-6 shrink-0">
      <ProfileStrengthCard profileStrength={data.profileStrength} />
      <QuickStatsCard quickStats={data.quickStats} />
      <JobAlertsPromo
        digestEnabled={data.digest.enabled}
        skillGap={data.skillGap}
        onToggleDigest={(enabled) => digestMutation.mutate(enabled)}
        isTogglingDigest={digestMutation.isPending}
      />
    </aside>
  );
}
