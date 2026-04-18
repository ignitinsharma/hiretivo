import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JobDetailHeader } from '@/modules/jobs/components/JobDetailHeader';
import { JobDetailContent } from '@/modules/jobs/components/JobDetailContent';
import { JobDetailSidebar } from '@/modules/jobs/components/JobDetailSidebar';
import { ApplyJobModal } from '@/components/shared/ApplyJobModal';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function JobDescriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  const job = await prisma.job.findUnique({
    where: { id: params.id, status: 'OPEN' },
    include: {
      recruiter: {
        select: {
          recruiterProfile: {
            select: { companyName: true, logo: true },
          },
        },
      },
      skills: {
        include: { skill: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!job) notFound();

  let matchScore: number | null = null;
  let matchBreakdown: Array<{ skillId: string; skillName: string; isMatch: boolean }> | null = null;

  if (session?.user?.role === 'SEEKER') {
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: { select: { skillId: true, skill: { select: { name: true } } } },
      },
    });

    if (seekerProfile) {
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
    companyName: job.recruiter.recruiterProfile?.companyName ?? 'Unknown',
    companyLogoUrl: job.recruiter.recruiterProfile?.logo ?? null,
    skills: job.skills.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      slug: s.skill.slug,
      level: s.level,
    })),
    publishedAt: job.publishedAt?.toISOString() ?? null,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobDetailHeader job={jobData} />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <JobDetailContent job={jobData} />
          <JobDetailSidebar
            job={jobData}
            matchScore={matchScore}
            matchBreakdown={matchBreakdown}
            isAuth={!!session?.user}
            userRole={session?.user?.role ?? null}
          />
        </div>
      </main>
      <Footer />
      <ApplyJobModal />
    </div>
  );
}
