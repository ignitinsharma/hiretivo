"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { formatLocation } from "@/modules/india-location";
import type { IndiaState } from "@/modules/india-location";

/*
 * StepReviewSubmit
 * Step 6 of seeker onboarding — Review & Submit.
 * Displays a read-only summary of all collected data across steps 1-5.
 * Shows a greyed-out verified badge preview and a submit CTA.
 * Calls onComplete() when the user submits for verification.
 *
 * @param onBack     - Navigate back to step 5
 * @param onComplete - Triggers final submission / completeSeekerOnboarding action
 */
interface StepReviewSubmitProps {
  onBack: () => void;
  onComplete: () => Promise<void>;
}

/* SectionCard — uniform section wrapper for review items */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-brand-success" />
        <h3 className="text-sm font-semibold text-brand-foreground">{title}</h3>
      </div>
      <div className="space-y-1.5 pl-6">{children}</div>
    </div>
  );
}

/* ReviewRow — a single label/value row inside a section */
function ReviewRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
      <span className="text-xs text-brand-foreground-muted uppercase tracking-wider w-28 shrink-0">
        {label}
      </span>
      <span className="text-sm text-brand-foreground">{value}</span>
    </div>
  );
}

/* Availability label map */
const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATELY: "Immediately",
  TWO_WEEKS: "2 weeks notice",
  ONE_MONTH_PLUS: "1 month+",
};

/* Experience level label map */
const EXP_LEVEL_LABELS: Record<string, string> = {
  ENTRY: "Entry (0–1yr)",
  JUNIOR: "Junior (1–3yr)",
  MID: "Mid (3–6yr)",
  SENIOR: "Senior (6yr+)",
};

/* Situation label map */
const SITUATION_LABELS: Record<string, string> = {
  ACTIVELY_LOOKING: "Actively looking",
  OPEN_TO_OFFERS: "Open to offers",
  EXPLORING_OPTIONS: "Exploring options",
  STUDENT_FRESH_GRAD: "Student / Fresh grad",
};

export function StepReviewSubmit({ onBack, onComplete }: StepReviewSubmitProps) {
  const { step1, step2, proofOfWork, experience, compensation } =
    useSeekerOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const salaryRange =
    compensation.salaryMin !== null && compensation.salaryMax !== null
      ? `$${compensation.salaryMin.toLocaleString()} – $${compensation.salaryMax.toLocaleString()} USD/yr`
      : compensation.salaryMin !== null
        ? `$${compensation.salaryMin.toLocaleString()}+ USD/yr`
        : null;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-brand-foreground">
            Review your profile
          </h2>
          <p className="text-brand-foreground-muted">
            Double-check everything before submitting for verification.
          </p>
        </div>

        {/* Profile summary sections */}
        <div className="space-y-3">
          {/* About you */}
          <SectionCard title="About you">
            <ReviewRow
              label="Situation"
              value={
                step1.situation ? SITUATION_LABELS[step1.situation] ?? step1.situation : null
              }
            />
            <ReviewRow
              label="Experience"
              value={
                step1.experienceLevel
                  ? EXP_LEVEL_LABELS[step1.experienceLevel] ?? step1.experienceLevel
                  : null
              }
            />
            <ReviewRow
              label="Location"
              value={
                step1.city && step1.state
                  ? formatLocation(step1.city, step1.state as IndiaState)
                  : null
              }
            />
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills">
            <ReviewRow label="Primary role" value={step2.primaryRole || null} />
            {step2.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {step2.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-lg text-xs font-medium border border-brand-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Proof of work */}
          <SectionCard title="Proof of work">
            <ReviewRow label="GitHub" value={proofOfWork.githubUrl || null} />
            <ReviewRow
              label="Projects"
              value={
                proofOfWork.projects.length > 0
                  ? `${proofOfWork.projects.length} project${proofOfWork.projects.length > 1 ? "s" : ""} added`
                  : null
              }
            />
            {proofOfWork.linkedinUrl && (
              <ReviewRow label="LinkedIn" value={proofOfWork.linkedinUrl} />
            )}
          </SectionCard>

          {/* Experience */}
          <SectionCard title="Experience">
            <ReviewRow
              label="Work"
              value={
                experience.workExperiences.length > 0
                  ? `${experience.workExperiences.length} position${experience.workExperiences.length > 1 ? "s" : ""}`
                  : null
              }
            />
            {experience.educations.length > 0 && (
              <ReviewRow
                label="Education"
                value={`${experience.educations.length} entry${experience.educations.length > 1 ? "ies" : ""}`}
              />
            )}
          </SectionCard>

          {/* Compensation */}
          <SectionCard title="Compensation">
            {compensation.headline && (
              <ReviewRow label="Headline" value={compensation.headline} />
            )}
            <ReviewRow label="Salary" value={salaryRange} />
            <ReviewRow
              label="Availability"
              value={
                compensation.availability
                  ? AVAILABILITY_LABELS[compensation.availability] ??
                    compensation.availability
                  : null
              }
            />
            {compensation.resume && (
              <ReviewRow label="Resume" value={compensation.resume.name} />
            )}
          </SectionCard>
        </div>

        {/* Verified badge preview */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-foreground">
              Verified Engineer badge
            </p>
            <p className="text-xs text-brand-foreground-muted">
              Submit to unlock your Verified badge — our team reviews within 48 hours.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            loadingText="Submitting..."
          >
            Submit for Verification
            <ShieldCheck className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <p className="text-xs text-brand-foreground-muted text-center">
            By submitting, you agree our team will review your profile within 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
