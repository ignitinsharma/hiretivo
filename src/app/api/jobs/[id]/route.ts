import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { JobStatus, UserRole } from '@/constants/enums';
import { getRateLimitIp, publicReadRateLimiter } from '@/lib/rate-limit';
import { resolveJobCompany, resolveCompanyLogoUrl } from '@/lib/jobs/resolve-job-company';

/*
 * GET /api/jobs/[id]
 * Returns public job detail with optional seeker match breakdown.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { success } = await publicReadRateLimiter.limit(getRateLimitIp(req));
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      skills: {
        include: { skill: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { applications: true } },
    },
  });
  const session = await auth();
  if (!job || (job.status !== JobStatus.OPEN && !session?.user?.isAdmin)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const company = resolveJobCompany({
    companyName: job.companyName,
    companyLogoUrl: job.companyLogoUrl,
    companySize: job.companySize,
    companyIndustry: job.companyIndustry,
    companyFunding: job.companyFunding,
    companyWebsite: job.companyWebsite,
  });

  let matchScore: number | null = null;
  let matchBreakdown: Array<{ skillId: string; skillName: string; isMatch: boolean }> | null = null;

  if (session?.user?.role === UserRole.SEEKER) {
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
    }
  }

  return NextResponse.json({
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      jobType: job.jobType,
      workType: job.workType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceLevel: job.experienceLevel,
      category: job.category,
      applyType: job.applyType,
      externalApplyUrl: job.externalApplyUrl,
      companyName: company.companyName,
      companyLogoUrl: resolveCompanyLogoUrl(company.companyLogoUrl, job.companyWebsite),
      skills: job.skills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        slug: s.skill.slug,
        level: s.level,
      })),
      publishedAt: job.publishedAt?.toISOString() ?? null,
      applicantCount: job._count.applications,
    },
    matchScore,
    matchBreakdown,
  });
}
