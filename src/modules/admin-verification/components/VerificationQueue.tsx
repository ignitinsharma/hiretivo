import { VerificationQueueRow } from "./VerificationQueueRow";
import type { VerificationStatus } from "@/constants/enums";

export type VerificationStatusValue = `${VerificationStatus}`;

export interface VerificationQueueSubmission {
  id: string;
  name: string | null;
  email: string | null;
  verificationStatus: VerificationStatusValue;
  profileSlug: string | null;
  updatedAt: Date;
  createdAt: Date;
  seekerProfile: {
    headline: string | null;
    primaryRole: string | null;
    githubUsername: string | null;
    salaryMinUsd: number | null;
    salaryMaxUsd: number | null;
  } | null;
  verificationReviews: Array<{
    createdAt: Date;
    status: VerificationStatusValue;
  }>;
}

interface VerificationQueueProps {
  submissions: VerificationQueueSubmission[];
}

/*
 * VerificationQueue
 * Renders the admin FIFO queue for pending and in-review engineer submissions.
 */
export function VerificationQueue({ submissions }: VerificationQueueProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center sm:p-12">
        <p className="mb-1 text-base font-semibold text-brand-foreground">
          Queue is clear
        </p>
        <p className="text-sm text-brand-foreground-muted">
          No pending or in-review submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <VerificationQueueRow key={submission.id} submission={submission} />
      ))}
    </div>
  );
}
