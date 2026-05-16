import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { JobStatus } from '@/constants/enums';

/* WeightedMatchInput — all fields for the 5-component weighted match formula */
export interface WeightedMatchInput {
  engineerSkills: string[]
  jobRequiredSkills: string[]
  engineerSalaryMin?: number | null   // USD
  engineerSalaryMax?: number | null   // USD
  jobSalaryMin?: number | null        // USD
  jobSalaryMax?: number | null        // USD
  engineerYearsExp?: number | null
  jobYearsExpRequired?: number | null
  engineerTimezoneOverlapHours?: number | null
  jobTimezoneOverlapHours?: number | null   // minimum required
  engineerAvailableFrom?: Date | null
}

/* EngineerMatchProfile — engineer fields needed for computeBestJobMatchForEngineer */
export interface EngineerMatchProfile {
  skills: string[]
  salaryMin?: number | null
  salaryMax?: number | null
  yearsExperience?: number | null
  timezoneOverlapHours?: number | null
  availableFrom?: Date | null
}

/* JobMatchProfile — job fields needed for computeBestJobMatchForEngineer */
export interface JobMatchProfile {
  id: string
  title: string
  requiredSkills: string[]
  salaryMin?: number | null
  salaryMax?: number | null
  yearsExpRequired?: number | null
  timezoneOverlapHours?: number | null
}

/*
 * computeWeightedJobMatch
 * 5-component weighted formula: skills(50%) + salary(20%) + experience(15%) + timezone(10%) + availability(5%)
 * Null handling: if a component's inputs are both null → skip weight, renormalize remaining to 100%
 * Returns integer 0-100
 */
export function computeWeightedJobMatch(input: WeightedMatchInput): number {
  const components: { weight: number; score: number | null }[] = []

  // 1. Skills (50%) — always present, never null
  const skillScore = input.jobRequiredSkills.length === 0
    ? 0
    : (() => {
        const set = new Set(input.engineerSkills)
        const intersection = input.jobRequiredSkills.filter(s => set.has(s)).length
        return intersection / input.jobRequiredSkills.length
      })()
  components.push({ weight: 50, score: skillScore })

  // 2. Salary (20%) — null if EITHER engineer OR job salary is missing
  const salaryScore: number | null = (
    input.engineerSalaryMin == null && input.engineerSalaryMax == null
  ) || (
    input.jobSalaryMin == null && input.jobSalaryMax == null
  )
    ? null
    : (() => {
        const eMin = input.engineerSalaryMin ?? 0
        const eMax = input.engineerSalaryMax ?? Number.MAX_SAFE_INTEGER
        const jMin = input.jobSalaryMin ?? 0
        const jMax = input.jobSalaryMax ?? Number.MAX_SAFE_INTEGER
        return Math.max(eMin, jMin) <= Math.min(eMax, jMax) ? 1.0 : 0.0
      })()
  components.push({ weight: 20, score: salaryScore })

  // 3. Experience (15%) — null if either yearsExp value is missing
  const expScore: number | null = (
    input.engineerYearsExp == null || input.jobYearsExpRequired == null
  )
    ? null
    : (() => {
        const bucket = (y: number) => y <= 2 ? 0 : y <= 5 ? 1 : 2
        const diff = Math.abs(bucket(input.engineerYearsExp!) - bucket(input.jobYearsExpRequired!))
        return diff === 0 ? 1.0 : diff === 1 ? 0.5 : 0.0
      })()
  components.push({ weight: 15, score: expScore })

  // 4. Timezone (10%) — null if either is missing
  const tzScore: number | null = (
    input.engineerTimezoneOverlapHours == null || input.jobTimezoneOverlapHours == null
  )
    ? null
    : input.engineerTimezoneOverlapHours >= input.jobTimezoneOverlapHours! ? 1.0 : 0.5
  components.push({ weight: 10, score: tzScore })

  // 5. Availability (5%) — null engineerAvailableFrom = immediate = 1.0
  const now = new Date()
  const avail = input.engineerAvailableFrom
  let availScore: number
  if (!avail || avail <= now) {
    availScore = 1.0
  } else {
    const daysUntil = Math.ceil((avail.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    availScore = daysUntil <= 30 ? 0.8 : daysUntil <= 60 ? 0.6 : 0.3
  }
  components.push({ weight: 5, score: availScore })

  // Renormalize: skip null-score components, redistribute their weight proportionally
  const active = components.filter(c => c.score !== null)
  if (active.length === 0) return 0
  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0)
  const raw = active.reduce((sum, c) => sum + (c.score! * c.weight), 0) / totalWeight
  return Math.round(raw * 100)
}

/*
 * computeBestJobMatchForEngineer
 * Returns highest weighted match score across recruiter's open jobs for a given engineer.
 * Returns null if no jobs provided.
 */
export function computeBestJobMatchForEngineer(
  engineerProfile: EngineerMatchProfile,
  recruiterOpenJobs: JobMatchProfile[],
): { score: number; jobTitle: string; jobId: string } | null {
  if (recruiterOpenJobs.length === 0) return null
  let best: { score: number; jobTitle: string; jobId: string } | null = null
  for (const job of recruiterOpenJobs) {
    const score = computeWeightedJobMatch({
      engineerSkills: engineerProfile.skills,
      jobRequiredSkills: job.requiredSkills,
      engineerSalaryMin: engineerProfile.salaryMin,
      engineerSalaryMax: engineerProfile.salaryMax,
      jobSalaryMin: job.salaryMin,
      jobSalaryMax: job.salaryMax,
      engineerYearsExp: engineerProfile.yearsExperience,
      jobYearsExpRequired: job.yearsExpRequired,
      engineerTimezoneOverlapHours: engineerProfile.timezoneOverlapHours,
      jobTimezoneOverlapHours: job.timezoneOverlapHours,
      engineerAvailableFrom: engineerProfile.availableFrom,
    })
    if (!best || score > best.score) {
      best = { score, jobTitle: job.title, jobId: job.id }
    }
  }
  return best
}

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

export async function upsertJobMatches(
  seekerProfileId: string,
  matches: { jobId: string; score: number }[],
): Promise<void> {
  if (matches.length === 0) return;

  await prisma.$transaction(
    matches.map((m) =>
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

  for (const sp of seekerSkills) {
    await invalidateSeekerCache(sp.seekerProfileId);
  }
}
