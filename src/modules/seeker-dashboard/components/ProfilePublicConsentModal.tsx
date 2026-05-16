"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfilePublicConsentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}

export function ProfilePublicConsentModal({
  isOpen,
  onOpenChange,
  onConfirmed,
}: ProfilePublicConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/engineer/profile/public-consent", {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(result.error ?? "Could not make your profile public.");
        return;
      }

      toast.success("Your profile is now public.");
      onConfirmed();
      onOpenChange(false);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border border-brand-border shadow-none sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
            Make your profile public?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-brand-foreground-muted">
            Making your profile public means your full name, Hiretivo Score,
            salary range, bio, top projects, skills, and availability will be
            visible to recruiters on Hiretivo. Your email address, GitHub URL,
            and LinkedIn URL remain hidden from public view.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={isSubmitting}
            loadingText="Publishing..."
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
