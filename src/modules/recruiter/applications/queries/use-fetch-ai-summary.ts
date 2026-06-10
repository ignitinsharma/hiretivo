'use client';

import { useQuery } from '@tanstack/react-query';
import { recruiterService } from '@/services/recruiter.service';

/*
 * useFetchAiSummary
 * Fetches (and caches) a candidate's AI summary, keyed per application id.
 * staleTime Infinity — the summary is immutable once generated, so reopening
 * the same candidate is served from memory: no spinner, no network round-trip.
 * The server already persists the summary (Application.aiSummary), so a first
 * fetch never re-runs the model on an already-generated candidate.
 * @param applicationId - Application to summarize (undefined when no candidate)
 * @param enabled - Run only while the drawer is open
 */
export function useFetchAiSummary(
  applicationId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['ai-summary', applicationId],
    queryFn: () => recruiterService.generateApplicationAiSummary(applicationId!),
    enabled: enabled && !!applicationId,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false, // do not retry AI calls — avoid double billing
  });
}
