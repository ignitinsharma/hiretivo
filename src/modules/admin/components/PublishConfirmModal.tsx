"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PublishConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

/*
 * PublishConfirmModal
 * Confirmation dialog shown before publishing an admin job.
 * Cancel preserves form data (no mutation). Publish fires the publish mutation.
 *
 * @param open - Controls dialog visibility
 * @param onOpenChange - Called when dialog open state changes
 * @param onConfirm - Called when user confirms publish
 * @param isPending - Disables buttons while mutation is in flight
 */
export function PublishConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: PublishConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish this job?</AlertDialogTitle>
          <AlertDialogDescription>
            Once published it will appear in the seeker feed and start matching
            with seekers based on skills.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Publishing…" : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
