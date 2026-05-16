'use client';

import React from 'react';
import { ChevronRight, Globe2, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUIStore } from '@/store/use-ui-store';
import { CurrencyCode, VerificationStatus, WorkType } from '@/constants/enums';
import { SaveJobButton } from '@/modules/jobs/components/SaveJobButton';
import { ApplyButton } from '@/modules/jobs/components/ApplyButton';
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
  engineerVerificationStatus: VerificationStatus | null;
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

export function JobDetailHeader({
  job,
  isAuth,
  userRole,
  engineerVerificationStatus,
}: JobDetailHeaderProps) {
  const { openApplyModal } = useUIStore();

  return (
    <>
      <nav className="flex items-center gap-2 mb-8 text-sm font-medium text-slate-500">
        <Link href="/jobs" className="hover:text-primary">Jobs</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">{job.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm p-3">
            {job.companyLogoUrl ? (
              <Image
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-primary font-bold text-2xl">
                {job.companyName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-base">
              <span className="font-semibold text-slate-900">{job.companyName}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>{job.jobType.replace('_', ' ')}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
              {job.workType && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <Globe2 className="w-4 h-4 text-black" />
                    {job.workType === WorkType.REMOTE ? '100% Remote' : job.workType}
                  </span>
                </>
              )}
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1 text-brand-foreground-muted">
                <Users className="w-4 h-4" />
                {formatApplicantCount(job.applicantCount)}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <SaveJobButton
            jobId={job.id}
            isAuth={isAuth}
            userRole={userRole}
            className="px-6 py-3"
          />
          <ApplyButton
            jobId={job.id}
            verificationStatus={isAuth ? engineerVerificationStatus : null}
            userRole={userRole}
            onApply={() =>
              openApplyModal(job.id, job.title, job.companyName, job.applyType, job.externalApplyUrl)
            }
            onLoginRequired={() =>
              openApplyModal(job.id, job.title, job.companyName, job.applyType, job.externalApplyUrl)
            }
            className="px-8 py-3"
          />
        </div>
      </div>
    </>
  );
}
