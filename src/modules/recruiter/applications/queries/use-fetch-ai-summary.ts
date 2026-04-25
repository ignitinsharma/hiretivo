'use client';

import { useMutation } from '@tanstack/react-query';
import { recruiterService } from '@/services/recruiter.service';

export function useFetchAiSummary() {
  return useMutation({
    mutationFn: recruiterService.generateApplicationAiSummary,
    retry: false, // do not retry AI calls — avoid double billing
  });
}
