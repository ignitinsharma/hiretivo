'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/constants/enums';
import { useVerificationStatus } from '@/hooks/use-verification-status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';

const RESUME_REQUIRED_ERROR = 'Upload your resume in Settings before applying. Go to /settings to continue.';

interface ExternalApplyConfirmationDialogProps {
  jobId: string;
  externalUrl: string;
  companyName: string;
}

export function ExternalApplyConfirmationDialog({
  jobId,
  externalUrl,
  companyName,
}: ExternalApplyConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { data: session } = useSession();
  const isSeeker = session?.user?.role === UserRole.SEEKER;
  const hiretivo = useVerificationStatus();

  /*
   * guardVerified
   * Blocks the action and shows a status-aware toast when a seeker is not
   * Hiretivo-verified. Returns true for non-seekers — the API enforces role.
   * Returns false silently while the status query is loading to avoid acting
   * on stale null state.
   */
  const guardVerified = (): boolean => {
    if (!isSeeker) return true;
    if (hiretivo.isLoading) return false;
    if (hiretivo.isVerified) return true;
    const msg =
      hiretivo.status === 'PENDING' || hiretivo.status === 'IN_REVIEW'
        ? 'Verification is pending — check back soon.'
        : hiretivo.status === 'REJECTED'
          ? 'Verification rejected. Check your email for next steps.'
          : 'Submit your profile for verification to apply.';
    toast.error(msg, {
      action:
        !hiretivo.status || hiretivo.status === 'NOT_SUBMITTED'
          ? { label: 'Start Verification', onClick: () => { window.location.href = '/settings'; } }
          : undefined,
    });
    return false;
  };

  const confirmApplied = async () => {
    if (!guardVerified()) return;

    setIsConfirming(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/external-apply/confirm`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? 'Could not confirm application.');
      }
      toast.success('Application confirmed.');
      trackEvent('apply_job', {
        apply_type: 'external',
        stage: 'success',
        entrypoint: 'redirect',
      });
      setIsOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not confirm application.';
      if (message === RESUME_REQUIRED_ERROR) {
        toast.error('Resume required before applying.', {
          action: {
            label: 'Upload Resume',
            onClick: () => {
              window.location.href = '/settings';
            },
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          if (!guardVerified()) return;
          trackEvent('apply_job', {
            apply_type: 'external',
            stage: 'attempt',
            entrypoint: 'redirect',
          });
          window.open(externalUrl, '_blank', 'noopener,noreferrer');
        }}
        className="w-full rounded-lg bg-brand-primary py-3.5 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
      >
        Continue to Application
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => {
          if (!guardVerified()) return;
          setIsOpen(true);
        }}
        className="w-full rounded-lg bg-gray-100 font-semibold text-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        I applied on {companyName}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-foreground ">
              Did you apply on the company site?
            </DialogTitle>
            <DialogDescription className="text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745] ">
              Confirming creates your Hiretivo application record and lets the recruiter track your application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-lg transition-transform hover:scale-105 active:scale-95"
            >
              Not yet
            </Button>
            <Button
              type="button"
              onClick={confirmApplied}
              disabled={isConfirming}
              className="rounded-lg bg-brand-primary text-white transition-transform hover:scale-105 active:scale-95"
            >
              {isConfirming ? 'Confirming...' : 'Yes, I applied'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
