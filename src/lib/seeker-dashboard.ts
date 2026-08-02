import { prisma } from '@/lib/prisma';
import { ApplicationStatus, JobStatus } from '@/constants/enums';
import type {
  QuickStatsSummary,
  SkillGapItem,
  SkillGapSummary,
} from '@/modules/seeker/dashboard/types/dashboard.types';

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
  const [applied, activeApplications] = await Promise.all([
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
  ]);

  return { applied, activeApplications, interviews: 0 };
}
