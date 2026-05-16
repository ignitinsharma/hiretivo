"use client";

import { useState } from "react";
import {
  Globe2,
  Clock3,
  BriefcaseBusiness,
  DollarSign,
  Building2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface FakeJob {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string;
  workType: string;
  jobType: string | null;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  isNew: boolean;
}

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  if (!min && !max) return "Competitive";

  const symbol =
    currency === "GBP"
      ? "£"
      : currency === "EUR"
        ? "€"
        : currency === "INR"
          ? "₹"
          : "$";
  const formatAmount = (amount: number): string =>
    `${symbol}${Math.round(amount / 1000)}k`;

  if (min && max) return `${formatAmount(min)} – ${formatAmount(max)}`;
  if (min) return `From ${formatAmount(min)}`;
  return max ? `Up to ${formatAmount(max)}` : "Competitive";
}

interface CompanyLogoProps {
  name: string;
  src: string;
}

function CompanyLogo({ name, src }: CompanyLogoProps) {
  const [showFallback, setShowFallback] = useState(false);

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
      {showFallback ? (
        <span className="text-lg font-bold text-brand-primary">
          {name.charAt(0)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          src={src}
          onError={() => setShowFallback(true)}
        />
      )}
    </div>
  );
}

interface FakeJobCardProps {
  job: FakeJob;
  className?: string;
}

export function FakeJobCard({ job, className }: FakeJobCardProps) {
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.currency);

  return (
    <article
      className={cn(
        "group flex h-full min-h-[270px] flex-col rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary",
        className,
      )}
      data-purpose="job-card"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo name={job.companyName} src={job.companyLogo} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-foreground">
              {job.companyName}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-foreground-muted">
              <Globe2 className="h-3.5 w-3.5 text-brand-primary" />
              <span>{job.workType}</span>
            </div>
          </div>
        </div>
        {job.isNew && (
          <span className="shrink-0 rounded-full border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-foreground">
            New
          </span>
        )}
      </div>

      <Link href="/seeker/login" className="block">
        <h3 className="truncate whitespace-nowrap overflow-hidden text-xl font-semibold leading-snug tracking-tight text-brand-foreground transition-colors group-hover:text-brand-primary">
          {job.title}
        </h3>
      </Link>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.jobType && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
            <Clock3 className="h-3.5 w-3.5" />
            {job.jobType}
          </span>
        )}
        {job.category && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {job.category}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-brand-border pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-bold text-brand-foreground">
            <DollarSign className="h-4 w-4 shrink-0 text-brand-primary" />
            <span className="truncate">{salary}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-foreground-muted">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>Direct company role</span>
          </div>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a47d9]"
          href="/seeker/login"
        >
          View
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
