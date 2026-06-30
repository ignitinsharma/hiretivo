import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { extractSkillsFromText } from '@/lib/ats/skill-extractor';
import { meetsQualityBar } from '@/lib/ats/filters';
import { COMPANY_REGISTRY } from '@/lib/ats/registry';
import { SkillLevel, JobStatus } from '@/constants/enums';

/* Heavy batch operation — cap at 2 runs/min per admin user. */
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, '1 m') });

export const runtime = 'nodejs';
export const maxDuration = 300;

const CORE_SKILLS = [
  'typescript', 'python', 'go', 'rust', 'react', 'node.js',
  'kubernetes', 'docker', 'aws', 'postgresql', 'machine learning',
];

/*
 * POST /api/admin/ats/backfill-skills
 * Admin-only, run once after deploying quality filter changes.
 *
 * Phase 1 — purge: closes admin-posted jobs from companies no longer in registry
 *            or whose description no longer passes the new quality bar.
 * Phase 2 — backfill: for surviving open jobs with zero JobSkill rows,
 *            re-extracts skills, writes JobSkill + JobMatch, clears Redis caches.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await ratelimit.limit(session.user.id);
  if (!success) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });

  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const skillNameToId = new Map(allSkills.map((s) => [s.name, s.id]));

  // ── Phase 1: purge jobs from dropped companies ──────────────────────────────
  const activeCompanyNames = new Set(COMPANY_REGISTRY.map((c) => c.name));

  const droppedCompanyJobs = await prisma.job.findMany({
    where: {
      isAdminPosted: true,
      status: JobStatus.OPEN,
      companyName: { notIn: [...activeCompanyNames] },
    },
    select: { id: true },
  });
  const droppedIds = droppedCompanyJobs.map((j) => j.id);

  let purgedByCompany = 0;
  if (droppedIds.length > 0) {
    await Promise.all([
      prisma.jobSkill.deleteMany({ where: { jobId: { in: droppedIds } } }),
      prisma.jobMatch.deleteMany({ where: { jobId: { in: droppedIds } } }),
    ]);
    const r = await prisma.job.updateMany({
      where: { id: { in: droppedIds } },
      data: { status: JobStatus.CLOSED, closedAt: new Date() },
    });
    purgedByCompany = r.count;
  }

  // ── Phase 2: purge jobs that fail the new quality bar ──────────────────────
  const openJobs = await prisma.job.findMany({
    where: { isAdminPosted: true, status: JobStatus.OPEN },
    select: {
      id: true, title: true, description: true, category: true,
      locationClass: true, jobType: true, visaSponsored: true,
    },
  });

  const failQualityIds: string[] = [];
  for (const job of openJobs) {
    const extracted = extractSkillsFromText(job.description ?? '', allSkills);
    const passes = meetsQualityBar(
      job.title,
      job.description ?? '',
      job.category,
      extracted,
      job.locationClass,
      job.jobType,
      job.visaSponsored,
    );
    if (!passes) failQualityIds.push(job.id);
  }

  let purgedByQuality = 0;
  if (failQualityIds.length > 0) {
    await Promise.all([
      prisma.jobSkill.deleteMany({ where: { jobId: { in: failQualityIds } } }),
      prisma.jobMatch.deleteMany({ where: { jobId: { in: failQualityIds } } }),
    ]);
    const r = await prisma.job.updateMany({
      where: { id: { in: failQualityIds } },
      data: { status: JobStatus.CLOSED, closedAt: new Date() },
    });
    purgedByQuality = r.count;
  }

  // ── Phase 3: backfill skills for surviving open jobs with 0 JobSkill rows ──
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
    // Only backfill if it has a core skill — matches the new quality bar
    const hasCoreSkill = extracted.some((s) => CORE_SKILLS.includes(s.toLowerCase()));
    if (!hasCoreSkill || extracted.length < 2) continue;

    const skillIds = extracted
      .map((name) => skillNameToId.get(name))
      .filter((id): id is string => id !== undefined);
    if (skillIds.length === 0) continue;

    await prisma.jobSkill.createMany({
      data: skillIds.map((skillId) => ({ jobId: job.id, skillId, level: SkillLevel.INTERMEDIATE })),
      skipDuplicates: true,
    });
    skillsWritten += skillIds.length;
    processedJobIds.push(job.id);
  }

  // ── Phase 4: compute JobMatch for backfilled jobs ──────────────────────────
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

        for (const sp of seekerProfiles) {
          const seekerSet = new Set(sp.skills.map((s) => s.skillId));
          const intersection = jobSkillIds.filter((id) => seekerSet.has(id)).length;
          const score = Math.round((intersection / jobSkillIds.length) * 100);
          if (score === 0) continue;

          await prisma.jobMatch.upsert({
            where: { jobId_seekerProfileId: { jobId, seekerProfileId: sp.id } },
            create: { jobId, seekerProfileId: sp.id, score },
            update: { score },
          });
          matchesComputed++;
        }
      }),
    );
  }

  // ── Phase 5: invalidate Redis match caches for affected seekers ────────────
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
    purgedByCompany,
    purgedByQuality,
    jobsBackfilled: processedJobIds.length,
    skillsWritten,
    matchesComputed,
    cacheKeysInvalidated: affectedSeekers.length,
  });
}
