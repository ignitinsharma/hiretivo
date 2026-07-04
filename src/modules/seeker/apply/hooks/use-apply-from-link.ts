'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seekerService } from '@/services/seeker.service';
import type { ApplyFromLinkInput } from '@/lib/validations/apply-from-link.schema';

interface UseApplyFromLinkResult {
  submit: (input: ApplyFromLinkInput) => void;
  isPending: boolean;
  isError: boolean;
  error: string | null;
  needsManualPaste: boolean;
  manualPasteReason: string | null;
}

/*
 * useApplyFromLink
 * TanStack mutation wrapping POST /api/seeker/apply/from-link. On a created
 * (or deduped) application it redirects into the Phase-5 wizard; on
 * needsManualPaste it exposes the flag + reason so the modal can reveal the
 * paste textarea instead of erroring.
 */
export function useApplyFromLink(): UseApplyFromLinkResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [needsManualPaste, setNeedsManualPaste] = useState(false);
  const [manualPasteReason, setManualPasteReason] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: ApplyFromLinkInput) => seekerService.applyFromLink(input),
    onSuccess: (res) => {
      if ('needsManualPaste' in res) {
        setNeedsManualPaste(true);
        setManualPasteReason(res.reason);
        return;
      }
      setNeedsManualPaste(false);
      setManualPasteReason(null);
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      router.push(`/dashboard/applications/${res.data.applicationId}`);
    },
  });

  return {
    submit: (input) => mutation.mutate(input),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error?.message ?? null,
    needsManualPaste,
    manualPasteReason,
  };
}
