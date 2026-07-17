import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JobDetailHeader } from '@/modules/jobs/components/JobDetailHeader';
import { JobDetailContent } from '@/modules/jobs/components/JobDetailContent';
import { JobDetailSidebar } from '@/modules/jobs/components/JobDetailSidebar';
import { auth } from '@/auth';
import { JobStatus, UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { resolveLogoUrl } from '@/lib/r2';
import { resolveCompanyLogoUrl } from '@/lib/jobs/resolve-job-company';
import { notFound, redirect } from 'next/navigation';

interface RecommendedJob {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  salaryRange: string;
  matchLabel: string | null;
}

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

export default async function JobDescriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/seeker/login?redirect=${encodeURIComponent(`/jobs/${params.id}`)}`);
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id, status: JobStatus.OPEN },
    include: {
      recruiter: {
        select: {
          recruiterProfile: {
            select: { id: true, companyName: true, logo: true },
          },
        },
      },
      skills: {
        include: { skill: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  let matchScore: number | null = null;
  let matchBreakdown: Array<{ skillId: string; skillName: string; isMatch: boolean }> | null = null;
  let seekerProfileId: string | null = null;

  if (session?.user?.role === UserRole.SEEKER) {
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: { select: { skillId: true, skill: { select: { name: true } } } },
      },
    });

    if (seekerProfile) {
      seekerProfileId = seekerProfile.id;
      const jobMatch = await prisma.jobMatch.findUnique({
        where: {
          jobId_seekerProfileId: {
            jobId: params.id,
            seekerProfileId: seekerProfile.id,
          },
        },
      });
      matchScore = jobMatch?.score ?? null;

      const seekerSkillIds = new Set(seekerProfile.skills.map((s) => s.skillId));
      matchBreakdown = job.skills.map((s) => ({
        skillId: s.skill.id,
        skillName: s.skill.name,
        isMatch: seekerSkillIds.has(s.skillId),
      }));

      // Best-effort view event for SKR-02 (Viewed counter).
      // Failures must not block page rendering — wrap and log only.
      prisma.clickEvent
        .create({
          data: {
            jobId: params.id,
            userId: session.user.id,
            source: 'job_detail_view',
          },
        })
        .catch((err: unknown) => {
          console.error('[job-detail-view] failed to record click event:', err);
        });
    }
  }

  const jobData = {
    id: job.id,
    title: job.title,
    description: job.description,
    jobType: job.jobType,
    workType: job.workType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    experienceLevel: job.experienceLevel,
    applyType: job.applyType,
    externalApplyUrl: job.externalApplyUrl,
    companyName: job.isAdminPosted
      ? (job.companyName ?? 'Unknown')
      : (job.recruiter.recruiterProfile?.companyName ?? 'Unknown'),
    companyLogoUrl: job.isAdminPosted
      ? resolveCompanyLogoUrl(job.companyLogoUrl, job.companyWebsite)
      : resolveLogoUrl(job.recruiter.recruiterProfile?.logo),
    companyId: job.isAdminPosted ? null : (job.recruiter.recruiterProfile?.id ?? null),
    skills: job.skills.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      slug: s.skill.slug,
      level: s.level,
    })),
    publishedAt: job.publishedAt?.toISOString() ?? null,
    applicantCount: job._count.applications,
  };
  const currentSkillIds = job.skills.map((jobSkill) => jobSkill.skillId);
  const recommendationFilters = [
    currentSkillIds.length > 0
      ? { skills: { some: { skillId: { in: currentSkillIds } } } }
      : null,
    job.category ? { category: job.category } : null,
    job.workType ? { workType: job.workType } : null,
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  const recommendedJobRecords = await prisma.job.findMany({
    where: {
      id: { not: job.id },
      status: JobStatus.OPEN,
      ...(recommendationFilters.length > 0 ? { OR: recommendationFilters } : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 12,
    include: {
      recruiter: {
        select: {
          recruiterProfile: {
            select: { companyName: true, logo: true },
          },
        },
      },
      skills: {
        select: { skillId: true },
      },
      // companyWebsite used for Google favicon fallback on admin-posted jobs
      jobMatches: seekerProfileId
        ? {
            where: { seekerProfileId },
            select: { score: true },
            take: 1,
          }
        : false,
    },
  });

  const currentSkillIdSet = new Set(currentSkillIds);
  const recommendedJobs: RecommendedJob[] = recommendedJobRecords
    .map((recommendedJob) => {
      const sharedSkillCount = recommendedJob.skills.filter((skill) =>
        currentSkillIdSet.has(skill.skillId),
      ).length;
      const seekerMatchScore = recommendedJob.jobMatches[0]?.score ?? null;
      const relevanceScore =
        sharedSkillCount * 20 +
        (recommendedJob.category === job.category ? 5 : 0) +
        (recommendedJob.workType === job.workType ? 3 : 0) +
        (seekerMatchScore ?? 0);

      return {
        id: recommendedJob.id,
        title: recommendedJob.title,
        companyName: recommendedJob.isAdminPosted
          ? (recommendedJob.companyName ?? 'Unknown')
          : (recommendedJob.recruiter.recruiterProfile?.companyName ?? 'Unknown'),
        companyLogoUrl: recommendedJob.isAdminPosted
          ? resolveCompanyLogoUrl(recommendedJob.companyLogoUrl, recommendedJob.companyWebsite)
          : resolveLogoUrl(recommendedJob.recruiter.recruiterProfile?.logo),
        salaryRange: formatSalaryRange(
          recommendedJob.salaryMin,
          recommendedJob.salaryMax,
          recommendedJob.currency,
        ),
        matchLabel:
          seekerMatchScore !== null
            ? `${seekerMatchScore}% Match`
            : sharedSkillCount > 0
              ? `${sharedSkillCount} Shared ${sharedSkillCount === 1 ? 'Skill' : 'Skills'}`
              : null,
        relevanceScore,
        publishedAt: recommendedJob.publishedAt?.getTime() ?? 0,
      };
    })
    .sort((first, second) => {
      if (second.relevanceScore !== first.relevanceScore) {
        return second.relevanceScore - first.relevanceScore;
      }

      return second.publishedAt - first.publishedAt;
    })
    .slice(0, 3)
    .map(({ id, title, companyName, companyLogoUrl, salaryRange, matchLabel }) => ({
      id,
      title,
      companyName,
      companyLogoUrl,
      salaryRange,
      matchLabel,
    }));

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobDetailHeader
          job={jobData}
          isAuth={!!session?.user}
          userRole={session?.user?.role ?? null}
        />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <JobDetailContent job={jobData} />
          <JobDetailSidebar
            job={jobData}
            matchScore={matchScore}
            matchBreakdown={matchBreakdown}
            isAuth={!!session?.user}
            userRole={session?.user?.role ?? null}
            recommendedJobs={recommendedJobs}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
