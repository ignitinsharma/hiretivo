"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  EMAIL_VERIFICATION_STATUS_QUERY_KEY,
  useEmailVerificationStatus,
} from "@/hooks/use-email-verification-status";
import { authService } from "@/services/auth.service";
import { useUIStore } from "@/store/use-ui-store";

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailVerificationBanner() {
  const { data: status, isLoading } = useEmailVerificationStatus();
  const queryClient = useQueryClient();
  const { openEmailVerificationModal } = useUIStore();
  const [cooldown, setCooldown] = useState(0);

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

  if (isLoading || !status?.requiresVerification) {
    return null;
  }

  return (
    <div className="border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-primary">
            <MailCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-foreground">
              Verify your email to unlock applications, publishing, and billing.
            </p>
            <p className="mt-0.5 truncate text-xs text-brand-foreground-muted">
              We sent the link to {status.email ?? "your email address"}.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => resendMutation.mutate()}
            disabled={cooldown > 0}
            loading={resendMutation.isPending}
            loadingText="Sending..."
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={checkAgain}>
            Check again
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openEmailVerificationModal}
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}
