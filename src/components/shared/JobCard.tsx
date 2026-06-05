import React from "react";
import {
  Ban,
  Bookmark,
  BriefcaseBusiness,
  Clock,
  MapPin,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SeekerJobBaseCard } from "@/components/shared/SeekerJobBaseCard";
import { cn } from "@/lib/utils";
import { formatApplicantCount } from "@/lib/jobs/format-applicant-count";
import type { JobListItem } from "@/modules/jobs/types/job.types";

const formatDetail = (str: string) =>
  str
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

interface JobCardProps {
  job: JobListItem;
  isSaved?: boolean;
  onApply?: () => void;
  onToggleSave?: () => void;
  saveActionPlacement?: "topRight" | "footer";
  isSaving?: boolean;
  onNotInterested?: () => void;
  isDismissing?: boolean;
  variant?: "default" | "compact";
  isPreview?: boolean;
  showDescription?: boolean;
  /** When set, replaces the Apply button with a locked/disabled state and this label. */
  applyLockedLabel?: string;
}

function formatEnumLabel(value?: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function hasText(value: string | null | undefined): value is string {
  return Boolean(value);
}

export function JobCard({
  job,
  isSaved = false,
  onApply,
  onToggleSave,
  saveActionPlacement = "topRight",
  isSaving = false,
  onNotInterested,
  isDismissing = false,
  variant = "default",
  isPreview = false,
  showDescription = false,
  applyLockedLabel,
}: JobCardProps) {
  const isCompact = variant === "compact";
  const saveLabel = isSaved
    ? `Remove ${job.title} from saved jobs`
    : `Save ${job.title}`;
  const showSaveAction = !isPreview && Boolean(onToggleSave);

  const companyDetails = [
    job.companyIndustry,
    job.companyFundingType,
    job.companySize,
  ]
    .filter(hasText)
    .map((item) => formatDetail(item));

  const facts = [
    { icon: MapPin, label: formatEnumLabel(job.workType) ?? job.location },
    { icon: BriefcaseBusiness, label: formatEnumLabel(job.jobType) },
    { icon: Clock, label: job.experienceLevel },
    { icon: Users, label: formatApplicantCount(job.applicantCount ?? 0) },
  ].filter((fact): fact is { icon: typeof MapPin; label: string } =>
    hasText(fact.label),
  );

  const matchedSkillNames = job.matchedSkillNames ?? [];
  const missingSkillNames = job.missingSkills ?? [];
  const visibleSkills =
    matchedSkillNames.length > 0 || missingSkillNames.length > 0
      ? [...matchedSkillNames.slice(0, 4), ...missingSkillNames.slice(0, 3)]
      : (job.tags ?? []);

  const skills = visibleSkills.map((skill) => ({
    label: skill,
    isPrimary: matchedSkillNames.includes(skill),
  }));

  return (
    <SeekerJobBaseCard
      className={cn(isCompact && "p-4")}
      jobHref={`/jobs/${job.id}`}
      companyHref={job.companyId ? `/companies/${job.companyId}` : null}
      title={job.title}
      companyName={job.companyName}
      companyLogoUrl={job.companyLogoUrl}
      companyDetails={companyDetails}
      metaBadge={
        job.postedAt ? (
          <span className="inline-flex rounded-lg bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-foreground">
            {job.postedAt}
          </span>
        ) : null
      }
      topRight={
        <>
          {job.matchScore !== undefined && (
            <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-bold uppercase text-brand-foreground">
              {job.matchScore}% Match
            </span>
          )}
          {showSaveAction && saveActionPlacement === "topRight" && (
            <button
              type="button"
              aria-label={saveLabel}
              title={saveLabel}
              onClick={onToggleSave}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                isSaved
                  ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                  : "border-brand-border bg-white text-brand-foreground-muted hover:bg-brand-surface",
              )}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </button>
          )}
        </>
      }
      facts={facts}
      skills={skills}
      description={showDescription ? (job.description ?? null) : null}
      hintText={job.missingSkillsHint}
      salaryRange={job.salaryRange}
      footerRight={
        isPreview ? null : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showSaveAction && saveActionPlacement === "footer" && (
              <Button
                type="button"
                onClick={onToggleSave}
                variant="secondary"
                size="sm"
                loading={isSaving}
                loadingText={isSaved ? "Removing" : "Saving"}
                aria-label={saveLabel}
                aria-pressed={isSaved}
              >
                <Bookmark
                  className={cn("h-4 w-4", isSaved && "fill-current")}
                />
                {isSaved ? "Saved" : "Save"}
              </Button>
            )}
            {onNotInterested && (
              <Button
                type="button"
                onClick={onNotInterested}
                variant="secondary"
                size="sm"
                loading={isDismissing}
                loadingText="Removing"
              >
                <Ban className="h-4 w-4" />
                Not interested
              </Button>
            )}
            {applyLockedLabel ? (
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="cursor-not-allowed"
                aria-disabled="true"
              >
                {applyLockedLabel}
              </Button>
            ) : (
              <Button
                onClick={onApply}
                variant="primary"
                size="sm"
                disabled={!onApply}
              >
                Apply Now
              </Button>
            )}
          </div>
        )
      }
    />
  );
}
