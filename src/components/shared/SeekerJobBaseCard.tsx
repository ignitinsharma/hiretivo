"use client";

import React from "react";
import Link from "next/link";
import { Building2, ThumbsUp, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/utils/html-sanitizer";

export interface SeekerJobCardFact {
  icon: LucideIcon;
  label: string;
}

interface SeekerJobBaseCardProps {
  jobHref: string;
  companyHref?: string | null;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  companyDetails?: string[];
  metaBadge?: React.ReactNode;
  topRight?: React.ReactNode;
  facts?: SeekerJobCardFact[];
  skills?: Array<{
    label: string;
    isPrimary?: boolean;
  }>;
  hintText?: string | null;
  description?: string | null;
  salaryRange?: string;
  footerRight?: React.ReactNode;
  className?: string;
}

/**
 * SeekerJobBaseCard
 * Shared seeker card shell used across jobs, saved jobs, and applications.
 * Returns a consistent structure for title/company/facts/skills/footer rows.
 */
export function SeekerJobBaseCard({
  jobHref,
  companyHref,
  title,
  companyName,
  companyLogoUrl,
  companyDetails = [],
  metaBadge,
  topRight,
  facts = [],
  skills = [],
  hintText,
  description,
  salaryRange,
  footerRight,
  className,
}: SeekerJobBaseCardProps) {
  return (
    <Card className={cn("group flex h-full flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
            {companyLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={companyLogoUrl}
                alt={`${companyName} logo`}
                width={64}
                height={64}
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Building2 className="h-6 w-6 text-brand-foreground-secondary" />
            )}
          </div>
          <div className="min-w-0">
            <Link href={jobHref}>
              <h3 className="truncate text-xl capitalize font-semibold leading-snug tracking-tight text-brand-foreground transition-colors group-hover:text-brand-primary">
                {title}
              </h3>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-foreground-muted">
              {companyHref ? (
                <Link
                  href={companyHref}
                  className="font-semibold capitalize text-brand-foreground transition-colors hover:text-brand-primary"
                >
                  {companyName}
                </Link>
              ) : (
                <span className="font-semibold capitalize text-brand-foreground">
                  {companyName}
                </span>
              )}
              {companyDetails.map((detail, index) => (
                <React.Fragment key={`${detail}-${index}`}>
                  <span className="text-brand-foreground-secondary">•</span>
                  <span>{detail}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {metaBadge}
          {topRight}
        </div>
      </div>

      {facts.length > 0 && (
        <div className="grid gap-2 border-t border-brand-border py-4 text-sm font-medium text-brand-foreground sm:grid-cols-3">
          {facts.map((fact) => {
            const Icon = fact.icon;
            return (
              <div key={fact.label} className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
                <span className="truncate capitalize">{fact.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.label}
              className={cn(
                "rounded-lg border px-3 py-1 text-sm font-medium",
                skill.isPrimary
                  ? "border-green-200 bg-green-50 text-brand-success"
                  : "border-brand-border bg-brand-surface text-brand-foreground-muted",
              )}
            >
              {skill.isPrimary ? (
                <ThumbsUp className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
              ) : null}
              {skill.label}
            </span>
          ))}
        </div>
      )}

      {description ? (
        <div
          className="mt-4 line-clamp-1 text-sm font-normal text-brand-foreground-muted [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
        />
      ) : null}

      {hintText ? (
        <p className="mt-3 text-xs font-medium text-brand-warning">
          {hintText}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-brand-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {salaryRange ? (
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-foreground">
            <Building2 className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            <span className="truncate">{salaryRange}</span>
          </div>
        ) : (
          <span />
        )}
        {footerRight}
      </div>
    </Card>
  );
}
