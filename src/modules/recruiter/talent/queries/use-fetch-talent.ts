'use client';

import { useQuery } from '@tanstack/react-query';

import type {
  TalentDetail,
  TalentDetailResponse,
  TalentListResponse,
} from '@/modules/recruiter/talent/types/talent.types';

export interface TalentFilters {
  q: string;
  skill: string;
  location: string;
  availability: string;
}

export class TalentForbiddenError extends Error {
  constructor() {
    super('Talent pool requires a paid recruiter plan.');
    this.name = 'TalentForbiddenError';
  }
}

const TALENT_QUERY_KEY = 'recruiter-talent';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (response.status === 403) {
    throw new TalentForbiddenError();
  }
  if (!response.ok) {
    throw new Error('Talent pool request failed.');
  }
  return response.json() as Promise<T>;
}

function toSearchParams(filters: TalentFilters): URLSearchParams {
  const params = new URLSearchParams({ page: '1', limit: '24' });
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.skill.trim()) params.set('skill', filters.skill.trim());
  if (filters.location.trim()) params.set('location', filters.location.trim());
  if (filters.availability.trim()) {
    params.set('availability', filters.availability.trim());
  }
  return params;
}

export function useFetchTalent(filters: TalentFilters) {
  return useQuery({
    queryKey: [TALENT_QUERY_KEY, filters],
    queryFn: async () => {
      const params = toSearchParams(filters);
      const response = await fetchJson<TalentListResponse>(
        `/api/recruiter/talent?${params.toString()}`,
      );
      return response.data;
    },
  });
}

export function useFetchTalentDetail(seekerId: string | null) {
  return useQuery({
    queryKey: [TALENT_QUERY_KEY, 'detail', seekerId],
    enabled: Boolean(seekerId),
    queryFn: async (): Promise<TalentDetail> => {
      if (!seekerId) throw new Error('Missing seeker id.');
      const response = await fetchJson<TalentDetailResponse>(
        `/api/recruiter/talent/${seekerId}`,
      );
      return response.data;
    },
  });
}
