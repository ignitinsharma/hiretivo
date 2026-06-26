import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { JobStatus } from '@/constants/enums';

export function computeMatchScore(
  seekerSkillIds: string[],
  jobSkillIds: string[],
): number {
  if (jobSkillIds.length === 0) return 0;
  const seekerSet = new Set(seekerSkillIds);
  const intersection = jobSkillIds.filter((id) => seekerSet.has(id)).length;
  return Math.round((intersection / jobSkillIds.length) * 100);
}

export async function computeAllMatches(
  seekerProfileId: string,
): Promise<{ jobId: string; score: number }[]> {
  const seekerSkills = await prisma.seekerSkill.findMany({
    where: { seekerProfileId },
    select: { skillId: true },
  });
  const seekerSkillIds = seekerSkills.map((s) => s.skillId);

  const jobs = await prisma.job.findMany({
    where: { status: JobStatus.OPEN },
    select: {
      id: true,
      skills: { select: { skillId: true } },
    },
  });

  const matches: { jobId: string; score: number }[] = [];
  for (const job of jobs) {
    const jobSkillIds = job.skills.map((s) => s.skillId);
    const score = computeMatchScore(seekerSkillIds, jobSkillIds);
    if (score > 0) {
      matches.push({ jobId: job.id, score });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/*
 * upsertJobMatches
 * Upserts match records for a seeker across all jobs.
 * Chunked to 50 at a time using Promise.allSettled to avoid transaction timeout.
 * @param seekerProfileId - seeker profile ID
 * @param matches - array of { jobId, score } to upsert
 */
export async function upsertJobMatches(
  seekerProfileId: string,
  matches: { jobId: string; score: number }[],
): Promise<void> {
  if (matches.length === 0) return;

  const CHUNK_SIZE = 50;
  for (let i = 0; i < matches.length; i += CHUNK_SIZE) {
    const chunk = matches.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map((m) =>
        prisma.jobMatch.upsert({
          where: {
            jobId_seekerProfileId: {
              jobId: m.jobId,
              seekerProfileId,
            },
          },
          create: {
            jobId: m.jobId,
            seekerProfileId,
            score: m.score,
          },
          update: {
            score: m.score,
            computedAt: new Date(),
          },
        }),
      ),
    );
    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('[match] upsertJobMatches chunk failure:', r.reason);
      }
    }
  }
}

export async function invalidateSeekerCache(seekerProfileId: string): Promise<void> {
  const matches = await computeAllMatches(seekerProfileId);

  if (matches.length > 0) {
    await upsertJobMatches(seekerProfileId, matches);
  } else {
    await prisma.jobMatch.deleteMany({ where: { seekerProfileId } });
  }

  // Redis deletion is best-effort: don't let a missing/misconfigured Redis
  // instance block profile saves or onboarding completion.
  try {
    await redis.del(`match:${seekerProfileId}`);
  } catch (err) {
    console.error("[match] Redis cache invalidation failed (non-fatal):", err);
  }
}

export async function invalidateJobSkillsCache(jobId: string): Promise<void> {
  const jobSkills = await prisma.jobSkill.findMany({
    where: { jobId },
    select: { skillId: true },
  });
  const skillIds = jobSkills.map((s) => s.skillId);

  if (skillIds.length === 0) return;

  const seekerSkills = await prisma.seekerSkill.findMany({
    where: { skillId: { in: skillIds } },
    select: { seekerProfileId: true },
    distinct: ['seekerProfileId'],
  });

  await Promise.all(seekerSkills.map((sp) => invalidateSeekerCache(sp.seekerProfileId)));
}
