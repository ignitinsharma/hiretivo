/**
 * cleanup-jobs
 * One-time script: close OpenAI jobs (US-only in practice) + cap all companies to 5 most recent.
 * Run: npx tsx prisma/cleanup-jobs.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const JOB_CAP_PER_COMPANY = 5;

// Companies known to be US-only in practice (location classifier marks them worldwide
// because jobs say "Remote" but mean "Remote - US"). Close all their jobs.
const US_ONLY_COMPANIES = ['OpenAI'];

async function closeJobs(jobIds: string[], reason: string) {
  if (jobIds.length === 0) return 0;
  await Promise.all([
    prisma.jobSkill.deleteMany({ where: { jobId: { in: jobIds } } }),
    prisma.jobMatch.deleteMany({ where: { jobId: { in: jobIds } } }),
  ]);
  const r = await prisma.job.updateMany({
    where: { id: { in: jobIds } },
    data: { status: 'CLOSED', closedAt: new Date() },
  });
  console.log(`  Closed ${r.count} jobs — ${reason}`);
  return r.count;
}

async function main() {
  // Phase 1: close US-only companies entirely
  console.log('\nPhase 1: closing US-only companies...');
  let closedUsOnly = 0;
  for (const company of US_ONLY_COMPANIES) {
    const jobs = await prisma.job.findMany({
      where: { status: 'OPEN', companyName: company },
      select: { id: true },
    });
    closedUsOnly += await closeJobs(jobs.map((j) => j.id), `${company} (US-only)`);
  }

  // Phase 2: cap remaining companies to 5 most recent
  console.log('\nPhase 2: capping companies to 5 most recent jobs...');
  const companies = await prisma.job.groupBy({
    by: ['companyName'],
    where: {
      status: 'OPEN',
      companyName: { notIn: US_ONLY_COMPANIES },
    },
    _count: true,
    having: { companyName: { _count: { gt: JOB_CAP_PER_COMPANY } } },
  });

  console.log(`  ${companies.length} companies exceed ${JOB_CAP_PER_COMPANY}-job cap`);

  let closedByCap = 0;
  for (const company of companies) {
    // Keep 5 newest, close the rest
    const allJobs = await prisma.job.findMany({
      where: { status: 'OPEN', companyName: company.companyName },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    const toClose = allJobs.slice(JOB_CAP_PER_COMPANY).map((j) => j.id);
    closedByCap += await closeJobs(toClose, `${company.companyName} (cap: keep newest ${JOB_CAP_PER_COMPANY})`);
  }

  // Summary
  const remaining = await prisma.job.count({
    where: { status: 'OPEN' },
  });

  console.log('\n✅ Cleanup complete');
  console.log({
    closedUsOnly,
    closedByCap,
    totalClosed: closedUsOnly + closedByCap,
    remainingOpenJobs: remaining,
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
