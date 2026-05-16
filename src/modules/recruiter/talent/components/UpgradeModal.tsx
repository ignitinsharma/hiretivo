"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  engineerPreview?: { firstName: string; lastInitial: string; hiretivoScore: number };
}

/*
 * UpgradeModal
 * Shown to FREE-plan recruiters when they attempt to unlock an engineer.
 * Displays engineer preview (name blurred, score visible) and upgrade CTA.
 */
export function UpgradeModal({ open, onClose, engineerPreview }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-xl border-brand-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl text-brand-foreground">Unlock Verified Engineers</DialogTitle>
        </DialogHeader>

        {engineerPreview && (
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 mb-2">
            <p className="font-semibold text-brand-foreground">{engineerPreview.firstName} {engineerPreview.lastInitial}.</p>
            <p className="text-sm text-brand-foreground-muted">Hiretivo Score: {engineerPreview.hiretivoScore}/100</p>
          </div>
        )}

        <p className="text-brand-foreground-muted text-sm">
          Starter plan unlocks 10 engineers/mo — <strong className="text-brand-foreground">$199/mo</strong>.
          Unlock full contact details, GitHub, LinkedIn, and resume.
        </p>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" className="w-full sm:w-auto" asChild>
            <a href="/recruiter/settings/billing">Upgrade to Starter →</a>
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
