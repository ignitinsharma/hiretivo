import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { extractSkillsFromText } from '@/lib/ats/skill-extractor';
import { SkillLevel, JobStatus } from '@/constants/enums';

export const runtime = 'nodejs';
export const maxDuration = 300;

/*
 * POST /api/admin/ats/backfill-skills
 * One-time admin endpoint: finds all admin-posted open jobs with zero JobSkill records,
 * re-extracts skills from their description, writes JobSkill rows, and recomputes
 * JobMatch scores for affected seekers.
 * Returns counts of jobs processed, skills written, and matches computed.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const skillNameToId = new Map(allSkills.map((s) => [s.name, s.id]));

  // Find all admin-posted open jobs that have zero JobSkill records
  const jobsWithoutSkills = await prisma.job.findMany({
    where: {
      isAdminPosted: true,
      status: JobStatus.OPEN,
      skills: { none: {} },
    },
    select: { id: true, description: true },
  });

  let skillsWritten = 0;
  const processedJobIds: string[] = [];

  for (const job of jobsWithoutSkills) {
    const extracted = extractSkillsFromText(job.description ?? '', allSkills);
    if (extracted.length === 0) continue;

    const skillIds = extracted
      .map((name) => skillNameToId.get(name))
      .filter((id): id is string => id !== undefined);

    if (skillIds.length === 0) continue;

    await prisma.jobSkill.createMany({
      data: skillIds.map((skillId) => ({
        jobId: job.id,
        skillId,
        level: SkillLevel.INTERMEDIATE,
      })),
      skipDuplicates: true,
    });

    skillsWritten += skillIds.length;
    processedJobIds.push(job.id);
  }

  // Recompute matches: for each processed job, find seekers with overlapping skills
  // and upsert JobMatch rows.
  let matchesComputed = 0;
  const CHUNK = 10;
  for (let i = 0; i < processedJobIds.length; i += CHUNK) {
    const chunk = processedJobIds.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map(async (jobId) => {
        const jobSkills = await prisma.jobSkill.findMany({
          where: { jobId },
          select: { skillId: true },
        });
        if (jobSkills.length === 0) return;

        const jobSkillIds = jobSkills.map((js) => js.skillId);
        const seekerProfiles = await prisma.seekerProfile.findMany({
          where: { skills: { some: { skillId: { in: jobSkillIds } } } },
          select: { id: true, skills: { select: { skillId: true } } },
        });

        const matches = seekerProfiles
          .map((sp) => {
            const seekerSet = new Set(sp.skills.map((s) => s.skillId));
            const intersection = jobSkillIds.filter((id) => seekerSet.has(id)).length;
            const score = Math.round((intersection / jobSkillIds.length) * 100);
            return { seekerProfileId: sp.id, score };
          })
          .filter((m) => m.score > 0);

        for (const m of matches) {
          await prisma.jobMatch.upsert({
            where: { jobId_seekerProfileId: { jobId, seekerProfileId: m.seekerProfileId } },
            create: { jobId, seekerProfileId: m.seekerProfileId, score: m.score },
            update: { score: m.score },
          });
          matchesComputed++;
        }
      }),
    );
  }

  // Invalidate Redis match caches for all affected seekers
  const affectedSeekers = await prisma.jobMatch.findMany({
    where: { jobId: { in: processedJobIds } },
    select: { seekerProfileId: true },
    distinct: ['seekerProfileId'],
  });

  const { redis } = await import('@/lib/redis');
  await Promise.allSettled(
    affectedSeekers.map((sp) => redis.del(`match:${sp.seekerProfileId}`)),
  );

  return NextResponse.json({
    jobsWithoutSkills: jobsWithoutSkills.length,
    jobsProcessed: processedJobIds.length,
    skillsWritten,
    matchesComputed,
    cacheKeysInvalidated: affectedSeekers.length,
  });
}
