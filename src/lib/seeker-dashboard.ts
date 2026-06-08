import { prisma } from '@/lib/prisma';
import { ApplicationStatus, InterviewStatus, JobStatus } from '@/constants/enums';
import type {
  ProfileStrengthSummary,
  QuickStatsSummary,
  SkillGapItem,
  SkillGapSummary,
} from '@/modules/seeker/dashboard/types/dashboard.types';

/** The ten fields that determine profile completeness per D-01/D-02. */
const CORE_PROFILE_FIELDS = [
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

type CoreField = (typeof CORE_PROFILE_FIELDS)[number];

const FIELD_LABELS: Record<CoreField, string> = {
  headline: 'headline',
  bio: 'professional bio',
  location: 'location',
  yearsExperience: 'years of experience',
  workPreference: 'work preference',
  primaryRole: 'primary role',
  salaryMin: 'minimum salary',
  salaryMax: 'maximum salary',
  availability: 'availability',
  resumeKey: 'resume',
};

const FIELD_HREFS: Record<CoreField, string> = {
  headline: '/seeker/settings',
  bio: '/seeker/settings',
  location: '/seeker/settings',
  yearsExperience: '/seeker/settings',
  workPreference: '/seeker/settings',
  primaryRole: '/seeker/settings',
  salaryMin: '/seeker/settings',
  salaryMax: '/seeker/settings',
  availability: '/seeker/settings',
  resumeKey: '/seeker/settings',
};

type PartialSeekerProfile = Partial<Record<CoreField, unknown>>;

export function getProfileStrengthSummary(
  profile: PartialSeekerProfile | null,
): ProfileStrengthSummary {
  if (!profile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalFields: CORE_PROFILE_FIELDS.length,
      nextMissingField: null,
      ctaLabel: 'Complete your profile',
      ctaHref: '/seeker/settings',
    };
  }

  const missing: CoreField[] = CORE_PROFILE_FIELDS.filter(
    (f) => profile[f] === null || profile[f] === undefined,
  );
  const completedCount = CORE_PROFILE_FIELDS.length - missing.length;
  const percentage = Math.round(
    (completedCount / CORE_PROFILE_FIELDS.length) * 100,
  );
  const nextMissingField = missing[0] ?? null;

  const ctaLabel = nextMissingField
    ? `Add your ${FIELD_LABELS[nextMissingField]}`
    : 'Profile complete';
  const ctaHref = nextMissingField
    ? FIELD_HREFS[nextMissingField]
    : '/seeker/settings';

  return {
    percentage,
    completedCount,
    totalFields: CORE_PROFILE_FIELDS.length,
    nextMissingField,
    ctaLabel,
    ctaHref,
  };
}

/**
 * Pure synchronous helper — returns exact display names for skills the seeker
 * is missing compared to a job's required skills. No DB calls.
 */
export function getMissingSkillNames(
  seekerSkillIds: string[],
  jobSkills: Array<{ skillId: string; skill: { name: string } }>,
): string[] {
  const seekerSet = new Set(seekerSkillIds);
  return jobSkills
    .filter((js) => !seekerSet.has(js.skillId))
    .map((js) => js.skill.name);
}

export async function getSkillGapSummary(
  seekerProfileId: string,
  appliedJobIds: string[],
): Promise<SkillGapSummary> {
  // Find all active jobs (not applied to) and their required skills
  const openJobs = await prisma.job.findMany({
    where: {
      status: JobStatus.OPEN,
      id: { notIn: appliedJobIds },
    },
    select: {
      skills: {
        select: {
          skillId: true,
          skill: { select: { name: true } },
        },
      },
    },
  });

  // Get seeker's current skill IDs
  const seekerSkills = await prisma.seekerSkill.findMany({
    where: { seekerProfileId },
    select: { skillId: true },
  });
  const seekerSkillSet = new Set(seekerSkills.map((s) => s.skillId));

  // Tally missing skills by frequency
  const freq = new Map<string, number>();
  for (const job of openJobs) {
    for (const js of job.skills) {
      if (!seekerSkillSet.has(js.skillId)) {
        freq.set(js.skill.name, (freq.get(js.skill.name) ?? 0) + 1);
      }
    }
  }

  const items: SkillGapItem[] = Array.from(freq.entries())
    .map(([skillName, frequency]) => ({ skillName, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  return { items, total: freq.size };
}

export async function getQuickStatsSummary(
  userId: string,
): Promise<QuickStatsSummary> {
  const [applied, activeApplications, interviews] = await Promise.all([
    prisma.application.count({ where: { seekerId: userId } }),
    prisma.application.count({
      where: {
        seekerId: userId,
        status: {
          in: [
            ApplicationStatus.APPLIED,
            ApplicationStatus.REVIEWING,
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.OFFER,
          ],
        },
      },
    }),
    prisma.interview.count({
      where: { seekerId: userId, status: InterviewStatus.SCHEDULED },
    }),
  ]);

  return { applied, activeApplications, interviews };
}
