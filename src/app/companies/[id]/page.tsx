import React from 'react';
import { notFound } from 'next/navigation';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CompanyHeader } from '@/modules/companies/components/CompanyHeader';
import { CompanyAbout } from '@/modules/companies/components/CompanyAbout';
import { CompanyJobs } from '@/modules/companies/components/CompanyJobs';
import { CompanySidebar } from '@/modules/companies/components/CompanySidebar';
import { JobStatus } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { resolveLogoUrl } from '@/lib/r2';

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (!min && !max) return 'Competitive';
  const minStr = min ? `${symbol}${Math.round(min / 1000)}k` : '';
  const maxStr = max ? `${symbol}${Math.round(max / 1000)}k` : '';
  if (min && max) return `${minStr} - ${maxStr}`;
  return minStr || maxStr;
}

export default async function CompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          jobsPosted: {
            where: { status: JobStatus.OPEN },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              title: true,
              jobType: true,
              workType: true,
              salaryMin: true,
              salaryMax: true,
              currency: true,
              experienceLevel: true,
              publishedAt: true,
            },
          },
        },
      },
    },
  });

  if (!profile) notFound();

  const company = {
    id: profile.id,
    name: profile.companyName,
    logoUrl: resolveLogoUrl(profile.logo),
    website: profile.website,
    bio: profile.bio,
    companySize: profile.companySize,
    industry: profile.industry,
    fundingType: profile.fundingType,
    isFullyRemote: profile.isFullyRemote,
  };

  const openJobs = profile.user.jobsPosted.map((job) => ({
    id: job.id,
    title: job.title,
    jobType: job.jobType,
    workType: job.workType,
    salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
    experienceLevel: job.experienceLevel,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompanyHeader company={company} openRoleCount={openJobs.length} />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-8 w-full">
            {company.bio && <CompanyAbout companyName={company.name} bio={company.bio} />}
            <CompanyJobs jobs={openJobs} />
          </div>
          
          <CompanySidebar company={company} openRoleCount={openJobs.length} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
