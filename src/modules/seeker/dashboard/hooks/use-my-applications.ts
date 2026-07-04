import { useQuery } from '@tanstack/react-query';
import { seekerService } from '@/services/seeker.service';

export const myApplicationsQueryKey = ['seeker-dashboard-applications'] as const;

/*
 * useMyApplications
 * Full application list (+ passed jobs) backing both the /dashboard
 * applications table and the /dashboard/tracker kanban — shared query key so
 * a status change from either page invalidates the other's cache too.
 */
export function useMyApplications() {
  return useQuery({
    queryKey: myApplicationsQueryKey,
    queryFn: async () => (await seekerService.getMyDashboardApplications()).data,
    staleTime: 15_000,
  });
}
