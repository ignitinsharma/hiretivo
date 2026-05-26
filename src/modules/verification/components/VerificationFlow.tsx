"use client";

import { format, isAfter } from "date-fns";
import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";

import { VerificationStatus } from "@/constants/enums";
import type { CodingProfileInput } from "@/lib/verification/coding-profiles";
import { StepGitHub } from "@/modules/verification/components/steps/StepGitHub";
import { StepCodingProfiles } from "@/modules/verification/components/steps/StepCodingProfiles";
import { StepVideo } from "@/modules/verification/components/steps/StepVideo";
import type { VerificationReadinessResult } from "@/lib/verification/readiness";

interface VerificationFlowProps {
  initialStatus: VerificationStatus;
  reapplyAfter: string | null;
  prefillGithubUrl: string | null;
  prefillCodingProfiles: CodingProfileInput[];
  prefillVideoIntroUrl: string | null;
  readiness: VerificationReadinessResult;
}

export interface VerificationProject {
  name: string;
  description: string;
  sourceUrl: string;
  liveUrl?: string | null;
}

export interface VerificationFormData {
  githubUrl: string;
  codingProfiles: CodingProfileInput[];
  videoIntroUrl: string;
}

const TOTAL_STEPS = 5;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const step = index + 1;
        const isCurrent = step === currentStep;
        const isComplete = step < currentStep;

        return (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium ${
                isCurrent
                  ? "border-brand-primary bg-brand-primary text-brand-primary-foreground"
                  : isComplete
                    ? "border-brand-success bg-brand-success text-white"
                    : "border-brand-border bg-white text-brand-foreground-muted"
              }`}
            >
              {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : step}
            </span>
            {step < TOTAL_STEPS ? (
              <span
                className={`h-px w-8 ${
                  isComplete ? "bg-brand-success" : "bg-brand-border"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function VerificationFlow({
  initialStatus,
  reapplyAfter,
  prefillGithubUrl,
  prefillCodingProfiles,
  prefillVideoIntroUrl,
  readiness,
}: VerificationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<VerificationFormData>({
    githubUrl: prefillGithubUrl ?? "",
    codingProfiles: prefillCodingProfiles,
    videoIntroUrl: prefillVideoIntroUrl ?? "",
  });

  const reapplyDate = reapplyAfter ? new Date(reapplyAfter) : null;
  const cannotReapply =
    initialStatus === VerificationStatus.REJECTED &&
    reapplyDate !== null &&
    isAfter(reapplyDate, new Date());

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/engineer/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoIntroUrl: formData.videoIntroUrl.trim() || null,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSubmitError(result.error ?? "Submission failed. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cannotReapply && reapplyDate) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-brand-foreground">
          Reapply window not yet open
        </h1>
        <p className="mt-2 text-sm text-brand-foreground-muted">
          You can resubmit after {format(reapplyDate, "MMM d, yyyy")}.
        </p>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-brand-primary">Under review - 48hrs</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-foreground">
          Your verification is under review
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
          We&apos;ll email you within 48 hours with our decision.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-brand-foreground-secondary">
          Your profile was submitted for human review. AI assistance may be used to
          organize your profile evidence for admins.
        </p>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
          Get Hiretivo Verified
        </h1>
        <p className="mt-2 text-base leading-relaxed text-brand-foreground-muted">
          Confirm your profile is complete, connect GitHub, add optional coding
          evidence, and submit for admin review.
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 ? (
        <section className="space-y-6 rounded-xl border border-brand-border bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-foreground">
              Profile readiness
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
              Verification uses your saved profile settings. Complete every required
              item before submitting.
            </p>
          </div>

          {readiness.missingFields.length > 0 ? (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
              <p className="text-sm font-semibold text-brand-foreground">
                Missing items
              </p>
              <ul className="mt-3 space-y-2 text-sm text-brand-foreground-muted">
                {readiness.missingFields.map((field) => (
                  <li key={field} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-danger" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/seeker/settings#account"
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-surface"
                >
                  Edit profile
                </Link>
                <Link
                  href="/seeker/settings#experience"
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-surface"
                >
                  Add work history
                </Link>
                <Link
                  href="/seeker/settings#projects"
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-surface"
                >
                  Add projects
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-success">
                <Check className="h-4 w-4" />
                Profile readiness complete
              </p>
            </div>
          )}

          <div className="rounded-xl border border-brand-border bg-white p-4">
            <p className="text-sm font-semibold text-brand-foreground">
              Completed items
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {readiness.completedFields.map((field) => (
                <span
                  key={field}
                  className="rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand-foreground-muted"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!readiness.isReady}
              onClick={() => setCurrentStep(2)}
              className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary-foreground hover:bg-brand-primary-dk disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <StepGitHub
          onBack={() => setCurrentStep(1)}
          onChange={(githubUrl) =>
            setFormData((previous) => ({ ...previous, githubUrl }))
          }
          onNext={() => setCurrentStep(3)}
          value={formData.githubUrl}
        />
      ) : null}

      {currentStep === 3 ? (
        <StepCodingProfiles
          onBack={() => setCurrentStep(2)}
          onChange={(codingProfiles) =>
            setFormData((previous) => ({ ...previous, codingProfiles }))
          }
          onNext={() => setCurrentStep(4)}
          value={formData.codingProfiles}
        />
      ) : null}

      {currentStep === 4 ? (
        <StepVideo
          onBack={() => setCurrentStep(3)}
          onChange={(videoIntroUrl) =>
            setFormData((previous) => ({ ...previous, videoIntroUrl }))
          }
          onNext={() => setCurrentStep(5)}
          value={formData.videoIntroUrl}
        />
      ) : null}

      {currentStep === 5 ? (
        <section className="space-y-6 rounded-xl border border-brand-border bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-foreground">
              Submit for verification
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
              Your saved profile, GitHub evidence, projects, and work history will
              be reviewed. Optional coding profile links are used as extra evidence.
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-brand-foreground-muted">GitHub</dt>
                <dd className="break-words text-brand-foreground">
                  {formData.githubUrl || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted">Profile readiness</dt>
                <dd className="text-brand-foreground">
                  {readiness.isReady ? "Complete" : "Incomplete"}
                </dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted">Coding profiles</dt>
                <dd className="text-brand-foreground">
                  {formData.codingProfiles.length}
                </dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted">Video</dt>
                <dd className="text-brand-foreground">
                  {formData.videoIntroUrl.trim() ? "Included" : "Skipped"}
                </dd>
              </div>
            </dl>
          </div>

          {submitError ? <p className="text-sm text-brand-danger">{submitError}</p> : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setCurrentStep(4)}
              className="rounded-lg border border-brand-border bg-white px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-surface disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!readiness.isReady || submitting}
              onClick={handleSubmit}
              className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary-foreground hover:bg-brand-primary-dk disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
