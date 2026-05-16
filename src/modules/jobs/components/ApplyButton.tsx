"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserRole, VerificationStatus } from "@/constants/enums";

interface ApplyButtonProps {
  jobId: string;
  verificationStatus: VerificationStatus | null;
  userRole: UserRole | string | null;
  onApply: () => void;
  onLoginRequired: () => void;
  className?: string;
}

/*
 * ApplyButton
 * Renders job apply CTAs based on engineer verification status.
 */
export function ApplyButton({
  jobId,
  verificationStatus,
  userRole,
  onApply,
  onLoginRequired,
  className,
}: ApplyButtonProps) {
  if (!verificationStatus || !userRole) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={onLoginRequired}
        className={className}
        aria-label={`Apply to job ${jobId}`}
      >
        Apply
      </Button>
    );
  }

  if (userRole === UserRole.RECRUITER) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={onApply}
        className={className}
        aria-label={`Apply to job ${jobId}`}
      >
        Apply
      </Button>
    );
  }

  if (verificationStatus === VerificationStatus.VERIFIED) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={onApply}
        className={className}
        aria-label={`Apply to job ${jobId}`}
      >
        Apply
      </Button>
    );
  }

  if (
    verificationStatus === VerificationStatus.NOT_SUBMITTED ||
    verificationStatus === VerificationStatus.REJECTED
  ) {
    return (
      <Button asChild variant="primary" className={className}>
        <Link href="/seeker/verification">
          Get Verified to Apply
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      disabled
      className={className}
    >
      Verification in progress - check back soon
    </Button>
  );
}
