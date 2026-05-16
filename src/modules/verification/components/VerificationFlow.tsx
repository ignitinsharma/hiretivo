"use client";

import { format, isAfter } from "date-fns";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { VerificationStatus } from "@/constants/enums";
import { StepBioProjects } from "@/modules/verification/components/steps/StepBioProjects";
import { StepGitHub } from "@/modules/verification/components/steps/StepGitHub";
import { StepSlugSubmit } from "@/modules/verification/components/steps/StepSlugSubmit";
import { StepVideo } from "@/modules/verification/components/steps/StepVideo";

interface VerificationFlowProps {
  initialStatus: VerificationStatus;
  reapplyAfter: string | null;
  prefillGithubUsername: string | null;
  userName: string;
}

export interface VerificationProject {
  name: string;
  description: string;
  url: string;
}

export interface VerificationFormData {
  githubUrl: string;
  legalName: string;
  bio: string;
  topProjects: VerificationProject[];
  videoIntroUrl: string;
  profileSlug: string;
}

const TOTAL_STEPS = 4;

function makeInitialSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

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
  prefillGithubUsername,
  userName,
}: VerificationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const initialSlug = useMemo(() => makeInitialSlug(userName), [userName]);
  const [formData, setFormData] = useState<VerificationFormData>({
    githubUrl: prefillGithubUsername ? `https://github.com/${prefillGithubUsername}` : "",
    legalName: userName,
    bio: "",
    topProjects: [{ name: "", description: "", url: "" }],
    videoIntroUrl: "",
    profileSlug: initialSlug,
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
          topProjects: formData.topProjects.map((project) => ({
            name: project.name.trim(),
            description: project.description.trim(),
            url: project.url.trim(),
          })),
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
          help evaluate your GitHub profile.
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
          Complete GitHub, bio, projects, video, and profile URL details for review.
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 ? (
        <StepGitHub
          onChange={(githubUrl) =>
            setFormData((previous) => ({ ...previous, githubUrl }))
          }
          onNext={() => setCurrentStep(2)}
          value={formData.githubUrl}
        />
      ) : null}

      {currentStep === 2 ? (
        <StepBioProjects
          bio={formData.bio}
          legalName={formData.legalName}
          onBack={() => setCurrentStep(1)}
          onChangeBio={(bio) => setFormData((previous) => ({ ...previous, bio }))}
          onChangeName={(legalName) =>
            setFormData((previous) => ({ ...previous, legalName }))
          }
          onChangeProjects={(topProjects) =>
            setFormData((previous) => ({ ...previous, topProjects }))
          }
          onNext={() => setCurrentStep(3)}
          topProjects={formData.topProjects}
        />
      ) : null}

      {currentStep === 3 ? (
        <StepVideo
          onBack={() => setCurrentStep(2)}
          onChange={(videoIntroUrl) =>
            setFormData((previous) => ({ ...previous, videoIntroUrl }))
          }
          onNext={() => setCurrentStep(4)}
          value={formData.videoIntroUrl}
        />
      ) : null}

      {currentStep === 4 ? (
        <StepSlugSubmit
          formData={formData}
          onBack={() => setCurrentStep(3)}
          onChangeSlug={(profileSlug) =>
            setFormData((previous) => ({ ...previous, profileSlug }))
          }
          onSubmit={handleSubmit}
          profileSlug={formData.profileSlug}
          submitError={submitError}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}
