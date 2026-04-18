import { useQuery } from '@tanstack/react-query';
import type { DashboardData } from '@/modules/recruiter/dashboard/types/dashboard.types';

export function useFetchRecruiterDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['recruiter-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/recruiter/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}