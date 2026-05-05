import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Ban,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Clock,
  type LucideIcon,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobListItem } from "@/modules/jobs/types/job.types";
import { Button } from "@/components/ui/button";

const formatDetail = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();



interface JobCardProps {
  job: JobListItem;
  isSaved?: boolean;
  onApply?: () => void;
  onToggleSave?: () => void;
  onNotInterested?: () => void;
  isDismissing?: boolean;
  variant?: "default" | "compact";
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

interface CardFact {
  icon: LucideIcon;
  label: string;
}

export function JobCard({
  job,
  isSaved = false,
  onApply,
  onToggleSave,
  onNotInterested,
  isDismissing = false,
  variant = "default",
}: JobCardProps) {
  const isCompact = variant === "compact";
  const saveLabel = isSaved
    ? `Remove ${job.title} from saved jobs`
    : `Save ${job.title}`;
  const companyDetails = [
    job.companyIndustry,
    job.companyFundingType,
    job.companySize,
  ].filter(hasText);
  const facts = [
    { icon: MapPin, label: formatEnumLabel(job.workType) ?? job.location },
    { icon: BriefcaseBusiness, label: formatEnumLabel(job.jobType) },
    { icon: Clock, label: job.experienceLevel },
  ].filter((fact): fact is CardFact => hasText(fact.label));
  const matchedSkillNames = job.matchedSkillNames ?? [];
  const missingSkillNames = job.missingSkills ?? [];
  const visibleSkills =
    matchedSkillNames.length > 0 || missingSkillNames.length > 0
      ? [...matchedSkillNames.slice(0, 4), ...missingSkillNames.slice(0, 3)]
      : (job.tags ?? []);

  return (
    <div className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-brand-surface">
            {job.companyLogoUrl ? (
              <Image
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                width={64}
                height={64}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="text-xl font-bold text-brand-foreground-secondary">
                {job.companyName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-col items-center">
            <Link href={`/jobs/${job.id}`}>
              <h3 className="text-xl font-semibold leading-[1.25] tracking-[-0.22px] truncate text-foreground transition-colors group-hover:text-brand-primary">
                {job.title}
              </h3>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-foreground-muted">
              {job.companyId ? (
                <Link
                  href={`/companies/${job.companyId}`}
                  className="text-foreground capitalize font-semibold transition-colors hover:text-brand-primary"
                >
                  {job.companyName}
                </Link>
              ) : (
                <span className="text-foreground capitalize font-semibold">
                  {job.companyName}
                </span>
              )}
              {companyDetails.map((detail, index) => (
                <React.Fragment key={`${detail}-${index}`}>
                  <span className="text-brand-foreground-secondary ">•</span>
                  <span>{formatDetail(detail)}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {job.postedAt && (
            <span className="mb-2 inline-flex rounded-lg bg-brand-surface px-3 py-1 text-xs font-semibold text-foreground">
              {job.postedAt}
            </span>
          )}
          {job.matchScore !== undefined && (
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase text-black">
              {job.matchScore}% Match
            </span>
          )}

          {onToggleSave && (
            <button
              type="button"
              aria-label={saveLabel}
              title={saveLabel}
              onClick={onToggleSave}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                isSaved
                  ? "border-black bg-gray-100 text-black"
                  : "border-gray-200 bg-white text-muted-foreground hover:bg-gray-50",
              )}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </button>
          )}
        </div>
      </div>

      {facts.length > 0 && (
        <div className="grid gap-2 border-t border-gray-200 py-4 text-sm font-medium text-foreground sm:grid-cols-3">
          {facts.map((fact) => {
            const Icon = fact.icon;
            return (
              <div key={fact.label} className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
                <span className="truncate">{fact.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleSkills.map((skill) => {
            const isMatched = matchedSkillNames.includes(skill);
            return (
              <span
                key={skill}
                className={cn(
                  "rounded-lg border px-3 py-1 text-sm font-medium",
                  isMatched
                    ? "border-brand-success bg-brand-surface text-brand-success"
                    : "border-gray-200 bg-gray-100 text-brand-foreground-muted",
                )}
              >
                {skill}
              </span>
            );
          })}
        </div>
      )}

      {job.missingSkillsHint && (
        <p className="mt-3 text-xs font-medium text-brand-warning">
          {job.missingSkillsHint}
        </p>
      )}

      <div
        className={cn(
          "mt-5 flex items-center justify-between gap-3 border-t border-gray-200 pt-4",
          isCompact && "mt-3 pt-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <Building2 className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
          <span className="truncate">{job.salaryRange}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
          <Button
            onClick={onApply}
            variant="primary"
            size="sm"
            disabled={!onApply}
          >
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
}
