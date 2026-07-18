'use client';

import React from 'react';
import { ChevronRight, Globe2, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';
import { CurrencyCode, UserRole, WorkType } from '@/constants/enums';
import { SaveJobButton } from '@/modules/jobs/components/SaveJobButton';
import { useVerificationStatus } from '@/hooks/use-verification-status';
import { formatApplicantCount } from '@/lib/jobs/format-applicant-count';

interface JobData {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  jobType: string;
  workType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  applyType: string;
  externalApplyUrl: string | null;
  companyId: string | null;
  applicantCount: number;
}

interface JobDetailHeaderProps {
  job: JobData;
  isAuth: boolean;
  userRole: string | null;
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return 'Salary not specified';
  const cur = currency ?? CurrencyCode.USD;
  const symbol = cur === CurrencyCode.USD ? '$' : cur === CurrencyCode.GBP ? '£' : cur === CurrencyCode.EUR ? '€' : '';
  const minStr = min ? `${symbol}${Math.round(min / 1000)}k` : '';
  const maxStr = max ? `${symbol}${Math.round(max / 1000)}k` : '';
  if (min && max) return `${minStr} – ${maxStr}`;
  return minStr || maxStr;
}

export function JobDetailHeader({ job, isAuth, userRole }: JobDetailHeaderProps) {
  const { openApplyModal } = useUIStore();
  const hiretivo = useVerificationStatus();

  /*
   * applyLockedLabel
   * Truthy when the authenticated seeker is not yet Hiretivo-verified.
   * Shows 'Checking...' while the status query is in-flight to prevent a
   * false 'Get verified to apply' flash for already-verified seekers.
   * undefined means the normal Apply flow is allowed.
   */
  const applyLockedLabel: string | undefined =
    isAuth && userRole === UserRole.SEEKER
      ? hiretivo.isLoading
        ? 'Checking...'
        : !hiretivo.isVerified
          ? hiretivo.status === 'PENDING' || hiretivo.status === 'IN_REVIEW'
            ? 'Verification pending'
            : hiretivo.status === 'REJECTED'
              ? 'Fix profile to apply'
              : 'Get verified to apply'
          : undefined
      : undefined;

  return (
    <>
      <nav className="flex items-center gap-2 mb-8 text-sm font-medium text-brand-foreground-muted">
        <Link href="/jobs" className="hover:text-primary">Jobs</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-brand-foreground">{job.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white border border-brand-border rounded-xl flex items-center justify-center overflow-hidden">
            {job.companyLogoUrl ? (
              <Image
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-brand-surface rounded-xl flex items-center justify-center text-primary font-bold text-2xl">
                {job.companyName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-foreground tracking-tight mb-2">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-brand-foreground-muted text-base">
              {job.companyId ? (
                <Link
                  href={`/companies/${job.companyId}`}
                  className="font-semibold text-brand-foreground transition-colors hover:text-primary"
                >
                  {job.companyName}
                </Link>
              ) : (
                <span className="font-semibold text-brand-foreground">{job.companyName}</span>
              )}
              <span className="w-1 h-1 bg-brand-border rounded-full"></span>
              <span>{job.jobType.replace('_', ' ')}</span>
              <span className="w-1 h-1 bg-brand-border rounded-full"></span>
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
              {job.workType && (
                <>
                  <span className="w-1 h-1 bg-brand-border rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <Globe2 className="w-4 h-4 text-brand-foreground" />
                    {job.workType === WorkType.REMOTE ? '100% Remote' : job.workType}
                  </span>
                </>
              )}
              <span className="w-1 h-1 bg-brand-border rounded-full"></span>
              <span className="flex items-center gap-1 text-brand-foreground-muted">
                <Users className="w-4 h-4" />
                {formatApplicantCount(job.applicantCount)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveJobButton
            jobId={job.id}
            isAuth={isAuth}
            userRole={userRole}
            className="px-6 py-3"
          />
          {applyLockedLabel ? (
            <Button
              variant="secondary"
              className="px-8 py-3 cursor-not-allowed"
              disabled
              aria-disabled="true"
            >
              {applyLockedLabel}
            </Button>
          ) : (
            <Button
              onClick={() => openApplyModal(job.id, job.title, job.companyName, job.externalApplyUrl)}
              variant="primary"
              className="px-8 py-3"
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
