'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickStatsCard } from './QuickStatsCard';
import { JobAlertsPromo } from './JobAlertsPromo';
import { VerificationStatusCard } from './VerificationStatusCard';
import { seekerService } from '@/services/seeker.service';

const QUERY_KEY = ['seeker-dashboard-summary'] as const;

function SidebarSkeleton() {
  return (
    <div className="w-full lg:w-80 space-y-6 shrink-0">
      {/* Verification status skeleton */}
      <div className="rounded-xl border border-brand-border p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="bg-white p-6 rounded-xl border border-brand-border">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-2 w-full rounded-full mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="bg-white p-6 rounded-xl border border-brand-border">
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
    queryFn: seekerService.getDashboardSummary,
    staleTime: 0,
  });

  const digestMutation = useMutation({
    mutationFn: seekerService.updateDigestPreference,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  if (isLoading) return <SidebarSkeleton />;

  if (isError || !data) {
    return (
      <aside className="w-full lg:w-80 space-y-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-brand-border text-sm text-slate-500 text-center">
          Could not load dashboard data.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-80 space-y-6 shrink-0">
      {/* <VerificationStatusCard
        status={data.verification.status}
        verificationNotes={data.verification.verificationNotes}
      /> */}
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
