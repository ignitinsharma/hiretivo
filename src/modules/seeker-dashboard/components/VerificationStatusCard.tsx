"use client";

import { differenceInCalendarDays, format, isAfter } from "date-fns";
import { Check, Copy, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { VerificationStatus } from "@/constants/enums";
import { ProfilePublicConsentModal } from "./ProfilePublicConsentModal";

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
  profileSlug: string | null;
  profilePublic: boolean;
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

export function VerificationStatusCard({
  verificationStatus,
  hiretivoScore,
  reapplyAfter,
  profileSlug,
  profilePublic,
  lastReview,
}: VerificationStatusCardProps) {
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(profilePublic);
  const publicUrl = profileSlug ? `hiretivo.com/e/${profileSlug}` : null;

  function copyProfileUrl() {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(`https://${publicUrl}`);
    toast.success("Profile URL copied.");
  }

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

        {isProfilePublic ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-brand-success">
              Profile live - visible to recruiters
            </p>
            {publicUrl && (
              <div className="rounded-lg border border-brand-border bg-brand-surface p-3">
                <p className="break-all text-sm font-medium text-brand-foreground">
                  {publicUrl}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={copyProfileUrl}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {profileSlug && (
                <Button asChild variant="primary" className="flex-1">
                  <Link href={`/e/${profileSlug}`}>View My Profile</Link>
                </Button>
              )}
              <Button type="button" variant="secondary" disabled className="flex-1">
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Hide Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-brand-foreground-muted">
              Profile not public yet
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => setIsConsentOpen(true)}
              >
                Make Profile Public
              </Button>
              {profileSlug && (
                <Button asChild variant="secondary" className="flex-1">
                  <Link href={`/e/${profileSlug}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View Preview
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        <ProfilePublicConsentModal
          isOpen={isConsentOpen}
          onConfirmed={() => setIsProfilePublic(true)}
          onOpenChange={setIsConsentOpen}
        />
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
