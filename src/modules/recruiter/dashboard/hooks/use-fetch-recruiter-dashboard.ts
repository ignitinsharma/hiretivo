import { useQuery } from '@tanstack/react-query';
import { recruiterService } from '@/services/recruiter.service';
import type { DashboardData } from '@/modules/recruiter/dashboard/types/dashboard.types';

export function useFetchRecruiterDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['recruiter-dashboard'],
    queryFn: recruiterService.getDashboard,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
