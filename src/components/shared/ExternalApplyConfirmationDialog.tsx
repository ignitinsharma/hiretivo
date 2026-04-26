'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const confirmApplied = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/external-apply/confirm`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Could not confirm application.');
      }
      toast.success('Application confirmed.');
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not confirm application.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <Button
        asChild
        className="w-full rounded-full bg-[#5952e5] py-3.5 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
      >
        <a href={externalUrl} target="_blank" rel="noreferrer">
          Continue to Application
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>

      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-full bg-[rgba(89,82,229,0.08)] font-semibold text-[#0e0f0c] transition-transform hover:scale-105 active:scale-95"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        I applied on {companyName}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-[#0e0f0c] [font-feature-settings:'calt']">
              Did you apply on the company site?
            </DialogTitle>
            <DialogDescription className="text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745] [font-feature-settings:'calt']">
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
              className="rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
            >
              {isConfirming ? 'Confirming...' : 'Yes, I applied'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
