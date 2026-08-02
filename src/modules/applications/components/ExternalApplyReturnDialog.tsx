"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExternalApplyReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/* Asks the user whether they applied on the external job site after
 * returning to the tab. "Yes" marks the application as applied. */
export function ExternalApplyReturnDialog({
  open,
  onClose,
  onConfirm,
}: ExternalApplyReturnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-brand-foreground">
            Did you apply on the company site?
          </DialogTitle>
          <DialogDescription className="text-brand-foreground-muted">
            If yes, we&apos;ll mark this application as applied so your tracker
            stays accurate.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose}>
            Not yet
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Yes, I applied
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
