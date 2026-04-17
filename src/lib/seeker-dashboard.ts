import { prisma } from '@/lib/prisma';
import type {
  ProfileStrengthSummary,
  QuickStatsSummary,
  SkillGapItem,
  SkillGapSummary,
} from '@/modules/seeker/dashboard/types/dashboard.types';

export const CORE_PROFILE_FIELDS = [
  'headline',
  'bio',
  'location',
  'yearsExperience',
  'workPreference',
  'primaryRole',
  'salaryMin',
  'salaryMax',
  'availability',
  'resumeKey',
] as const;

const FIELD_CTA_LABELS: Record<string, string> = {
  headline: 'Add headline',
  bio: 'Add bio',
  location: 'Add location',
  yearsExperience: 'Add years of experience',
  workPreference: 'Set work preference',
  primaryRole: 'Set primary role',
  salaryMin: 'Set minimum salary',
  salaryMax: 'Set maximum salary',
  availability: 'Set availability',
  resumeKey: 'Upload resume',
};

const FIELD_CTA_HREFS: Record<string, string> = {
  headline: '/seeker/settings#headline',
  bio: '/seeker/settings#bio',
  location: '/seeker/settings#location',
  yearsExperience: '/seeker/settings#experience',
  workPreference: '/seeker/settings#preference',
  primaryRole: '/seeker/settings#role',
  salaryMin: '/seeker/settings#salary',
  salaryMax: '/seeker/settings#salary',
  availability: '/seeker/settings#availability',
  resumeKey: '/seeker/settings#resume',
};

interface ProfileFieldData {
  headline: string | null;
  bio: string | null;
  location: string | null;
  yearsExperience: number | null;
  workPreference: string | null;
  primaryRole: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  availability: string | null;
  resumeKey: string | null;
}

export async function getProfileStrengthSummary(
  userId: string
): Promise<ProfileStrengthSummary> {
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: {
      headline: true,
      bio: true,
      location: true,
      yearsExperience: true,
      workPreference: true,
      primaryRole: true,
      salaryMin: true,
      salaryMax: true,
      availability: true,
      resumeKey: true,
    },
  });

  if (!seekerProfile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: CORE_PROFILE_FIELDS.length,
      nextMissingField: 'headline',
      ctaLabel: 'Add headline',
      ctaHref: '/seeker/settings#headline',
    };
  }

  const profile = seekerProfile as unknown as ProfileFieldData;
  let completedCount = 0;
  let firstMissing: string | null = null;

  for (const field of CORE_PROFILE_FIELDS) {
    const value = profile[field];
    const isComplete = value !== null && value !== undefined && value !== '';
    if (isComplete) {
      completedCount++;
    } else if (!firstMissing) {
      firstMissing = field;
    }
  }

  const totalCount = CORE_PROFILE_FIELDS.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    percentage,
    completedCount,
    totalCount,
    nextMissingField: firstMissing,
    ctaLabel: firstMissing ? FIELD_CTA_LABELS[firstMissing] : null,
    ctaHref: firstMissing ? FIELD_CTA_HREFS[firstMissing] : null,
  };
}

export async function getMissingSkillNames(
  seekerUserId: string
): Promise<Set<string>> {
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: seekerUserId },
    include: {
      skills: {
        include: {
          skill: { select: { name: true } },
        },
      },
    },
  });

  if (!seekerProfile) {
    return new Set();
  }

  const seekerSkillNames = new Set(
    seekerProfile.skills.map((s) => s.skill.name.toLowerCase())
  );

  const appliedJobIds = await prisma.application.findMany({
    where: { seekerId: seekerUserId },
    select: { jobId: true },
  });
  const appliedIds = new Set(appliedJobIds.map((a) => a.jobId));

  const activeMatches = await prisma.jobMatch.findMany({
    where: {
      seekerProfileId: seekerProfile.id,
      job: {
        status: 'OPEN',
        publishedAt: { not: null },
      },
    },
    include: {
      job: {
        include: {
          skills: {
            include: {
              skill: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const missingSkills = new Set<string>();

  for (const match of activeMatches) {
    if (appliedIds.has(match.jobId)) {
      continue;
    }

    for (const jobSkill of match.job.skills) {
      const skillName = jobSkill.skill.name.toLowerCase();
      if (!seekerSkillNames.has(skillName)) {
        missingSkills.add(jobSkill.skill.name);
      }
    }
  }

  return missingSkills;
}

export async function getSkillGapSummary(
  seekerUserId: string
): Promise<SkillGapSummary> {
  const missingSkills = await getMissingSkillNames(seekerUserId);

  const skillFrequency: Record<string, number> = {};
  const missingSkillsArray = Array.from(missingSkills);
  for (const skillName of missingSkillsArray) {
    skillFrequency[skillName] = (skillFrequency[skillName] || 0) + 1;
  }

  const items: SkillGapItem[] = Object.entries(skillFrequency)
    .map(([skillName, frequency]) => ({ skillName, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  return {
    items,
    total: items.length,
  };
}

export async function getQuickStatsSummary(
  seekerUserId: string
): Promise<QuickStatsSummary> {
  const [appliedCount, viewedCount, interviewsCount] = await Promise.all([
    prisma.application.count({
      where: { seekerId: seekerUserId },
    }),
    prisma.clickEvent.count({
      where: {
        userId: seekerUserId,
        source: 'job_detail_view',
      },
    }),
    prisma.interview.count({
      where: {
        seekerId: seekerUserId,
        status: 'SCHEDULED',
      },
    }),
  ]);

  return {
    applied: appliedCount,
    viewed: viewedCount,
    interviews: interviewsCount,
  };
}