"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { VerificationFormData } from "@/modules/verification/components/VerificationFlow";

interface StepSlugSubmitProps {
  profileSlug: string;
  formData: VerificationFormData;
  onChangeSlug: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  submitError: string | null;
}

interface SlugCheckResult {
  available: boolean;
  suggestion?: string;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "pricing",
  "jobs",
  "engineers",
  "recruiter",
  "seeker",
  "login",
  "signup",
  "dashboard",
  "health",
  "feedback",
  "e",
  "app",
  "www",
  "support",
  "help",
  "about",
  "blog",
  "terms",
  "privacy",
  "careers",
  "hire",
  "hiretivo",
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
}

function getSlugValidationError(slug: string) {
  if (!slug) return null;
  if (slug.length < 3 || slug.length > 30) return "Use 3-30 characters.";
  if (!SLUG_REGEX.test(slug)) {
    return "Use lowercase letters, numbers, and hyphens with no leading or trailing hyphens.";
  }
  if (RESERVED_SLUGS.has(slug)) return "That slug is reserved.";
  return null;
}

export function StepSlugSubmit({
  profileSlug,
  formData,
  onChangeSlug,
  onSubmit,
  onBack,
  submitting,
  submitError,
}: StepSlugSubmitProps) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const normalizedSlug = useMemo(() => normalizeSlug(profileSlug), [profileSlug]);
  const slugError = getSlugValidationError(profileSlug);

  useEffect(() => {
    setSuggestion(null);

    if (!profileSlug) {
      setSlugStatus("idle");
      return;
    }

    if (slugError) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/engineer/check-slug?slug=${encodeURIComponent(profileSlug)}`,
        );
        const result = (await response.json()) as SlugCheckResult;
        setSlugStatus(result.available ? "available" : "taken");
        setSuggestion(result.suggestion ?? null);
      } catch {
        setSlugStatus("idle");
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [profileSlug, slugError]);

  const canSubmit =
    slugStatus === "available" &&
    !submitting &&
    formData.githubUrl.trim().startsWith("https://github.com/") &&
    formData.legalName.trim().length >= 2 &&
    formData.bio.trim().split(/\s+/).filter(Boolean).length >= 100 &&
    formData.topProjects.some(
      (project) =>
        project.name.trim() &&
        project.description.trim() &&
        project.url.trim().startsWith("https://"),
    );

  return (
    <section className="space-y-6 rounded-xl border border-brand-border bg-white p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-brand-foreground">
          Profile URL
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
          Pick the public URL recruiters will use after you make your profile public.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-foreground">
          Profile Slug
        </label>
        <div className="mt-2 flex flex-col overflow-hidden rounded-lg border border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 sm:flex-row">
          <span className="flex h-10 items-center border-b border-brand-border bg-brand-surface px-3 text-sm text-brand-foreground-muted sm:border-b-0 sm:border-r">
            hiretivo.com/e/
          </span>
          <input
            className="h-10 min-w-0 flex-1 px-3 text-sm outline-none"
            maxLength={30}
            onChange={(event) => onChangeSlug(normalizeSlug(event.target.value))}
            placeholder="firstnamelastname"
            value={profileSlug}
          />
        </div>
        {normalizedSlug !== profileSlug ? (
          <p className="mt-1 text-xs text-brand-foreground-secondary">
            Slug will be saved as {normalizedSlug}.
          </p>
        ) : null}
        <div className="mt-2 min-h-5 text-xs">
          {slugStatus === "checking" ? (
            <p className="flex items-center gap-2 text-brand-foreground-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking availability...
            </p>
          ) : null}
          {slugStatus === "available" ? (
            <p className="flex items-center gap-2 text-brand-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Available
            </p>
          ) : null}
          {slugStatus === "taken" ? (
            <p className="flex items-start gap-2 text-brand-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Taken.
                {suggestion ? (
                  <>
                    {" "}
                    Try{" "}
                    <button
                      className="font-medium underline"
                      onClick={() => onChangeSlug(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                    .
                  </>
                ) : null}
              </span>
            </p>
          ) : null}
          {slugStatus === "invalid" && slugError ? (
            <p className="flex items-start gap-2 text-brand-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {slugError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
          Review Summary
        </p>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-brand-foreground-muted">GitHub</dt>
            <dd className="break-words text-brand-foreground">{formData.githubUrl || "-"}</dd>
          </div>
          <div>
            <dt className="text-brand-foreground-muted">Legal name</dt>
            <dd className="text-brand-foreground">{formData.legalName || "-"}</dd>
          </div>
          <div>
            <dt className="text-brand-foreground-muted">Projects</dt>
            <dd className="text-brand-foreground">
              {formData.topProjects.filter((project) => project.name.trim()).length} added
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

      <p className="text-xs leading-relaxed text-brand-foreground-secondary">
        By submitting, you confirm all information is accurate. Your profile will be
        evaluated by our team, with AI assistance, within 48 hours.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          className="w-full sm:w-auto"
          disabled={submitting}
          onClick={onBack}
          variant="secondary"
        >
          Back
        </Button>
        <Button
          className="w-full sm:w-auto"
          disabled={!canSubmit}
          loading={submitting}
          loadingText="Submitting..."
          onClick={onSubmit}
          variant="primary"
        >
          Submit for Verification
        </Button>
      </div>
    </section>
  );
}
