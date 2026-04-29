import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BriefcaseBusiness,
  Building2,
  Clock,
  MapPin,
  type LucideIcon,
} from "lucide-react";

import { ApplicationStatus } from "@/constants/enums";
import { cn } from "@/lib/utils";
import type { SeekerApplicationItem } from "../types/application.types";

interface ApplicationCardProps {
  application: SeekerApplicationItem;
}

interface CardFact {
  icon: LucideIcon;
  label: string;
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

export function ApplicationCard({ application }: ApplicationCardProps) {
  const companyDetails = [
    application.companyIndustry,
    application.companyFundingType,
    application.companySize,
  ].filter(hasText);
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
      label: application.experienceLevel,
    },
  ].filter((fact): fact is CardFact => hasText(fact.label));

  return (
    <div className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-brand-surface">
            {application.companyLogoUrl ? (
              <Image
                src={application.companyLogoUrl}
                alt={`${application.companyName} logo`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-brand-foreground-secondary" />
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/jobs/${application.jobId}`}>
              <h3 className="truncate text-[22px] font-semibold leading-[1.25] tracking-[-0.22px] text-foreground transition-colors group-hover:text-brand-primary">
                {application.jobTitle}
              </h3>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-foreground-muted">
              <span className="font-semibold capitalize text-foreground">
                {application.companyName}
              </span>
              {companyDetails.map((detail, index) => (
                <React.Fragment key={`${detail}-${index}`}>
                  <span className="text-brand-foreground-secondary">•</span>
                  <span>{detail}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-brand-foreground-secondary">
          Applied {application.appliedAt}
        </span>
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

      {application.skills && application.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {application.skills.slice(0, 7).map((skill) => (
            <span
              key={skill}
              className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-brand-foreground-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
        {application.salaryRange ? (
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            <span className="truncate">{application.salaryRange}</span>
          </div>
        ) : (
          <span />
        )}
        <StatusBadge status={application.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  let badgeClasses = "";
  let dotClasses = "";
  let label: string = status;

  switch (status) {
    case ApplicationStatus.INTERVIEW:
      badgeClasses = "bg-primary/10 text-primary";
      dotClasses = "bg-primary";
      label = "Interview";
      break;
    case ApplicationStatus.REVIEWING:
      badgeClasses = "bg-blue-100 text-blue-700";
      dotClasses = "bg-blue-500";
      label = "Under Review";
      break;
    case ApplicationStatus.APPLIED:
      badgeClasses = "bg-slate-100 text-slate-600";
      dotClasses = "bg-slate-400";
      label = "Applied";
      break;
    case ApplicationStatus.OFFER:
      badgeClasses = "bg-amber-100 text-amber-700";
      dotClasses = "bg-amber-500";
      label = "Offer Received";
      break;
    case ApplicationStatus.HIRED:
      badgeClasses = "bg-gray-100 text-black";
      dotClasses = "bg-black";
      label = "Hired";
      break;
    case ApplicationStatus.REJECTED:
      badgeClasses = "bg-red-100 text-red-600";
      dotClasses = "bg-red-500";
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
