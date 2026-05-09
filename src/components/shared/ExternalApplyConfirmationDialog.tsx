'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useEmailVerificationStatus } from '@/hooks/use-email-verification-status';
import { useUIStore } from '@/store/use-ui-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';

const RESUME_REQUIRED_ERROR = 'Upload your resume in Settings before applying. Go to /seeker/settings to continue.';

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
  const { data: verificationStatus } = useEmailVerificationStatus();
  const { openEmailVerificationModal } = useUIStore();

  const guardVerifiedEmail = (): boolean => {
    if (!verificationStatus?.requiresVerification) return true;
    openEmailVerificationModal();
    return false;
  };

  const confirmApplied = async () => {
    if (!guardVerifiedEmail()) return;

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
              window.location.href = '/seeker/settings';
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
          if (!guardVerifiedEmail()) return;
          trackEvent('apply_job', {
            apply_type: 'external',
            stage: 'attempt',
            entrypoint: 'redirect',
          });
          window.open(externalUrl, '_blank', 'noopener,noreferrer');
        }}
        className="w-full rounded-full bg-brand-primary py-3.5 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
      >
        Continue to Application
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => {
          if (!guardVerifiedEmail()) return;
          setIsOpen(true);
        }}
        className="w-full rounded-full bg-gray-100 font-semibold text-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        I applied on {companyName}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-xl">
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
              className="rounded-full transition-transform hover:scale-105 active:scale-95"
            >
              Not yet
            </Button>
            <Button
              type="button"
              onClick={confirmApplied}
              disabled={isConfirming}
              className="rounded-full bg-brand-primary text-white transition-transform hover:scale-105 active:scale-95"
            >
              {isConfirming ? 'Confirming...' : 'Yes, I applied'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
