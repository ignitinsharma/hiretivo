"use client";

import { useEffect, useState } from "react";
import { MailCheck, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  EMAIL_VERIFICATION_STATUS_QUERY_KEY,
  useEmailVerificationStatus,
} from "@/hooks/use-email-verification-status";
import { authService } from "@/services/auth.service";
import { useUIStore } from "@/store/use-ui-store";

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailVerificationModal() {
  const {
    isEmailVerificationModalOpen,
    closeEmailVerificationModal,
  } = useUIStore();
  const { data: status } = useEmailVerificationStatus();
  const queryClient = useQueryClient();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!status?.isVerified || !isEmailVerificationModalOpen) return;
    closeEmailVerificationModal();
  }, [closeEmailVerificationModal, isEmailVerificationModalOpen, status?.isVerified]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resendMutation = useMutation({
    mutationFn: authService.resendVerificationEmail,
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("Verification email sent.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const checkAgain = async () => {
    await queryClient.invalidateQueries({
      queryKey: EMAIL_VERIFICATION_STATUS_QUERY_KEY,
    });
  };

  return (
    <Dialog
      open={isEmailVerificationModalOpen}
      onOpenChange={(open) => {
        if (!open) closeEmailVerificationModal();
      }}
    >
      <DialogContent className="rounded-xl border border-brand-border shadow-none sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <DialogTitle className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
            Verify your email
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-brand-foreground-muted">
            High-trust actions require a verified email address. Use the link
            sent to {status?.email ?? "your email address"}, then check again.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-brand-foreground">
                Verification protects candidates, recruiters, and billing.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-brand-foreground-muted">
                You can keep onboarding and editing your profile while this is
                pending.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => resendMutation.mutate()}
            disabled={cooldown > 0}
            loading={resendMutation.isPending}
            loadingText="Sending..."
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </Button>
          <Button type="button" variant="primary" onClick={checkAgain}>
            I verified, check again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
