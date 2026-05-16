import React from "react";
import { BriefcaseBusiness, Clock, MapPin } from "lucide-react";

import { ApplicationStatus, JobStatus } from "@/constants/enums";
import { SeekerJobBaseCard } from "@/components/shared/SeekerJobBaseCard";
import { cn } from "@/lib/utils";
import type { SeekerApplicationItem } from "../types/application.types";

interface ApplicationCardProps {
  application: SeekerApplicationItem;
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

/*
 * formatDetail
 * Converts raw enum strings (e.g. "PUBLICLY_TRADED") into readable labels
 * by replacing underscores with spaces and title-casing each word.
 */
function formatDetail(str: string): string {
  return str
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const companyDetails = [
    application.companyIndustry,
    application.companyFundingType,
    application.companySize,
  ]
    .filter(hasText)
    .map((item) => formatDetail(item));

  const facts = [
    {
      icon: MapPin,
      label: formatEnumLabel(application.workType),
    },
    {
      icon: BriefcaseBusiness,
      label: formatEnumLabel(application.jobType),
    },
    {
      icon: Clock,
      label:
        application.minYearsExperience != null
          ? `${application.minYearsExperience}+ years`
          : null,
    },
  ].filter((fact): fact is { icon: typeof MapPin; label: string } =>
    hasText(fact.label),
  );

  const skills = (application.skills ?? []).slice(0, 7).map((skill) => ({
    label: skill,
    isPrimary: true,
  }));

  return (
    <SeekerJobBaseCard
      jobHref={`/jobs/${application.jobId}`}
      companyHref={null}
      title={application.jobTitle}
      companyName={application.companyName}
      companyLogoUrl={application.companyLogoUrl}
      companyDetails={companyDetails}
      metaBadge={
        <span className="shrink-0 text-sm font-medium text-brand-foreground-secondary">
          Applied {application.appliedAt}
        </span>
      }
      facts={facts}
      skills={skills}
      description={application.description ?? null}
      salaryRange={application.salaryRange}
      footerRight={
        application.jobStatus === JobStatus.DELETED ? (
          <JobClosedBadge />
        ) : (
          <StatusBadge status={application.status} />
        )
      }
    />
  );
}

function JobClosedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-bold text-brand-foreground-muted">
      <span className="h-2 w-2 rounded-full bg-brand-foreground-secondary" />
      Job Closed
    </span>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  let badgeClasses = "";
  let dotClasses = "";
  let label: string = status;

  switch (status) {
    case ApplicationStatus.INTERVIEW:
      badgeClasses = "border border-brand-primary/30 bg-brand-primary/10 text-brand-primary";
      dotClasses = "bg-brand-primary";
      label = "Interview";
      break;
    case ApplicationStatus.REVIEWING:
      badgeClasses = "border border-brand-border bg-brand-surface text-brand-foreground";
      dotClasses = "bg-brand-foreground-secondary";
      label = "Under Review";
      break;
    case ApplicationStatus.APPLIED:
      badgeClasses = "border border-brand-border bg-brand-surface text-brand-foreground-muted";
      dotClasses = "bg-brand-foreground-secondary";
      label = "Applied";
      break;
    case ApplicationStatus.OFFER:
      badgeClasses = "border border-brand-warning/30 bg-brand-warning/10 text-brand-warning";
      dotClasses = "bg-brand-warning";
      label = "Offer Received";
      break;
    case ApplicationStatus.HIRED:
      badgeClasses = "border border-brand-success/30 bg-brand-success/10 text-brand-success";
      dotClasses = "bg-brand-success";
      label = "Hired";
      break;
    case ApplicationStatus.REJECTED:
      badgeClasses = "border border-brand-danger/30 bg-brand-danger/10 text-brand-danger";
      dotClasses = "bg-brand-danger";
      label = "Not Selected";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        badgeClasses,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotClasses)} />
      {label}
    </span>
  );
}
