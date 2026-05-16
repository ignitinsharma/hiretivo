"use client";

import { differenceInHours, format } from "date-fns";
import Link from "next/link";

import { VerificationStatus } from "@/constants/enums";
import { cn } from "@/lib/utils";
import type { VerificationQueueSubmission } from "./VerificationQueue";

interface VerificationQueueRowProps {
  submission: VerificationQueueSubmission;
}

function formatSalaryRange(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const minLabel = min ? `$${Math.round(min / 1000)}k` : "";
  const maxLabel = max ? `$${Math.round(max / 1000)}k` : "";
  return min && max ? `${minLabel} - ${maxLabel}` : minLabel || maxLabel;
}

/*
 * VerificationQueueRow
 * Shows a single engineer submission with status, FIFO date, and stale warning.
 */
export function VerificationQueueRow({
  submission,
}: VerificationQueueRowProps) {
  const isInReview = submission.verificationStatus === VerificationStatus.IN_REVIEW;
  const isStale =
    isInReview && differenceInHours(new Date(), new Date(submission.updatedAt)) >= 2;
  const salaryRange = formatSalaryRange(
    submission.seekerProfile?.salaryMinUsd ?? null,
    submission.seekerProfile?.salaryMaxUsd ?? null,
  );

  return (
    <Link
      href={`/admin/verification/${submission.id}`}
      className="block rounded-xl border border-brand-border bg-white p-4 transition-colors hover:border-gray-300 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-brand-foreground">
              {submission.name ?? "Unnamed engineer"}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                isInReview
                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                  : "border-brand-border bg-brand-surface text-brand-foreground-muted",
              )}
            >
              {isInReview ? "In review" : "Pending"}
            </span>
            {isStale && (
              <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Stale over 2h
              </span>
            )}
          </div>

          <p className="truncate text-sm text-brand-foreground-muted">
            {submission.email ?? "No email"}
          </p>
          {(submission.seekerProfile?.primaryRole || salaryRange) && (
            <p className="mt-1 text-sm text-brand-foreground-muted">
              {[submission.seekerProfile?.primaryRole, salaryRange]
                .filter(Boolean)
                .join(" - ")}
            </p>
          )}
          {submission.seekerProfile?.githubUsername && (
            <p className="mt-1 text-xs text-brand-foreground-secondary">
              github.com/{submission.seekerProfile.githubUsername}
            </p>
          )}
        </div>

        <div className="shrink-0 text-xs text-brand-foreground-secondary">
          Submitted {format(new Date(submission.createdAt), "MMM d, yyyy")}
        </div>
      </div>
    </Link>
  );
}
