"use client";

import { differenceInCalendarDays, format, isAfter } from "date-fns";
import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { VerificationStatus } from "@/constants/enums";

interface LastReview {
  status: string;
  scoreGiven: number | null;
  notes: unknown;
  createdAt: Date | string;
}

interface VerificationStatusCardProps {
  verificationStatus: VerificationStatus;
  hiretivoScore: number | null;
  reapplyAfter: Date | string | null;
  lastReview: LastReview | null;
}

interface RejectionNotes {
  reasons?: string[];
  customNote?: string;
}

function parseRejectionNotes(notes: unknown): RejectionNotes {
  if (typeof notes !== "object" || notes === null) return {};
  const value = notes as Record<string, unknown>;
  return {
    reasons: Array.isArray(value.reasons)
      ? value.reasons.filter((reason): reason is string => typeof reason === "string")
      : undefined,
    customNote:
      typeof value.customNote === "string" ? value.customNote : undefined,
  };
}

function formatOptionalDate(value: Date | string | null) {
  if (!value) return "Not available";
  return format(new Date(value), "MMM d, yyyy");
}

function AiReviewNotice() {
  return (
    <p className="mt-4 rounded-lg border border-brand-border bg-brand-surface p-3 text-xs leading-relaxed text-brand-foreground-muted">
      AI may help organize profile evidence, but final verification decisions are reviewed by a human.
    </p>
  );
}

export function VerificationStatusCard({
  verificationStatus,
  hiretivoScore,
  reapplyAfter,
  lastReview,
}: VerificationStatusCardProps) {
  if (verificationStatus === VerificationStatus.NOT_SUBMITTED) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-surface text-brand-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
          Get Hiretivo Verified
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
          Apply to jobs. Get discovered.
        </p>
        <Button asChild variant="primary" className="mt-5 w-full">
          <Link href="/seeker/verification">Submit for Verification</Link>
        </Button>
      </section>
    );
  }

  if (verificationStatus === VerificationStatus.PENDING) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-6">
        <p className="text-sm font-medium text-brand-primary">Under Review</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
          Submitted: {formatOptionalDate(lastReview?.createdAt ?? null)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
          We&apos;ll email you within 48 hours
        </p>
        <AiReviewNotice />
      </section>
    );
  }

  if (verificationStatus === VerificationStatus.IN_REVIEW) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-6">
        <p className="text-sm font-medium text-brand-primary">Admin review</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
          Admin is reviewing your profile
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
          Almost there - hang tight
        </p>
        <AiReviewNotice />
      </section>
    );
  }

  if (verificationStatus === VerificationStatus.VERIFIED) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-brand-success">
          <Check className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
          Hiretivo Verified
        </h2>
        <p className="mt-2 text-sm text-brand-foreground-muted">
          Score: {hiretivoScore ?? lastReview?.scoreGiven ?? 0}/100
        </p>
        <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
          You are eligible for recruiter discovery in the Talent Pool. Recruiters
          on paid plans can unlock your contact details.
        </p>
        <AiReviewNotice />
      </section>
    );
  }

  const reapplyDate = reapplyAfter ? new Date(reapplyAfter) : null;
  const daysRemaining =
    reapplyDate && isAfter(reapplyDate, new Date())
      ? Math.max(0, differenceInCalendarDays(reapplyDate, new Date()))
      : 0;
  const notes = parseRejectionNotes(lastReview?.notes);

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6">
      <h2 className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
        Verification needs updates
      </h2>
      {notes.reasons && notes.reasons.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-brand-foreground-muted">
          {notes.reasons.map((reason) => (
            <li key={reason}>- {reason}</li>
          ))}
        </ul>
      )}
      {notes.customNote && (
        <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
          {notes.customNote}
        </p>
      )}
      <p className="mt-4 text-sm font-medium text-brand-foreground">
        Can reapply: {formatOptionalDate(reapplyDate)} / Available in{" "}
        {daysRemaining} days
      </p>
      <AiReviewNotice />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary" className="flex-1">
          <Link href="/seeker/settings">Update Profile</Link>
        </Button>
        <Button
          asChild={daysRemaining === 0}
          variant="primary"
          disabled={daysRemaining > 0}
          className="flex-1"
        >
          {daysRemaining === 0 ? (
            <Link href="/seeker/verification">Resubmit</Link>
          ) : (
            "Resubmit"
          )}
        </Button>
      </div>
    </section>
  );
}
