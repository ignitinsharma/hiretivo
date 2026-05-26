'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { getInitials } from '@/lib/initials';
import { resolveLogoUrl } from '@/lib/r2';
import type { RecruiterSettingsData } from '@/services/recruiter.service';

interface ProfileResult {
  name: string | null;
  email: string | null;
  image: string | null;
  initials: string;
  avatarUrl: string | null;
  role: string | null;
  plan: string | null;
  companyName: string | null;
  companyLogo: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  update: () => Promise<unknown>;
}

export function useProfile(): ProfileResult {
  const { data: session, status, update } = useSession();

  const isRecruiter = session?.user?.role === 'RECRUITER';

  const recruiterQuery = useQuery<RecruiterSettingsData>({
    queryKey: ['recruiter-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: RecruiterSettingsData }>('/recruiter/settings');
      return data.data;
    },
    enabled: isRecruiter && status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });

  const companyName = recruiterQuery.data?.companyName ?? null;
  const companyLogo = recruiterQuery.data?.logo ?? null;
  const recruiterImage = recruiterQuery.data?.image ?? null;

  const priorityImage = companyLogo ?? session?.user?.image ?? recruiterImage;

  const name = session?.user?.name ?? recruiterQuery.data?.name ?? null;
  const initials = getInitials({ name, companyName });
  const avatarUrl = resolveLogoUrl(priorityImage);

  return {
    name,
    email: session?.user?.email ?? null,
    image: priorityImage,
    initials,
    avatarUrl,
    role: session?.user?.role ?? null,
    plan: session?.user?.plan ?? null,
    companyName,
    companyLogo,
    isLoading: status === 'loading' || (isRecruiter && recruiterQuery.isLoading),
    isAuthenticated: status === 'authenticated',
    update,
  };
}
