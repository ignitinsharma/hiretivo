'use client';

import { useMutation } from '@tanstack/react-query';

interface AiSummaryResult {
  summary: string;
}

async function fetchAiSummary(applicationId: string): Promise<AiSummaryResult> {
  const res = await fetch(`/api/recruiter/applications/${applicationId}/ai-summary`, {
    method: 'POST',
  });
  if (res.status === 403) {
    // Plan-gated — not an error we toast about; the UI handles this gracefully
    throw new Error('PLAN_GATED');
  }
  if (!res.ok) {
    throw new Error('Failed to generate summary');
  }
  const json = (await res.json()) as { data: AiSummaryResult };
  return json.data;
}

export function useFetchAiSummary() {
  return useMutation({
    mutationFn: fetchAiSummary,
    retry: false, // do not retry AI calls — avoid double billing
  });
}
