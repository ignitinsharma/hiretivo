import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RECRUITER_TRIAL_ENDS = process.env.RECRUITER_TRIAL_ENDS;
const FREE_ACTIVE_JOB_LIMIT = 1;

async function endRecruiterTrial() {
  if (!RECRUITER_TRIAL_ENDS) {
    console.error("RECRUITER_TRIAL_ENDS env var is not set.");
    process.exit(1);
  }

  const trialEnd = new Date(RECRUITER_TRIAL_ENDS);
  const now = new Date();

  if (now < trialEnd) {
    console.log(`Trial is still active (ends ${RECRUITER_TRIAL_ENDS}). Change to a past date to trigger expiry handling.`);
    process.exit(0);
  }

  console.log("Trial expired. Finding FREE plan recruiters with extra active jobs...");

  const usersWithJobs = await prisma.$queryRaw<Array<{
    id: string;
    email: string | null;
    name: string | null;
  }>>`
    SELECT u.id, u.email, u.name
    FROM "User" u
    JOIN "Job" j ON j."recruiterId" = u.id
    WHERE u.role = 'RECRUITER'
      AND u.plan = 'FREE'
      AND j.status = 'OPEN'
    GROUP BY u.id, u.email, u.name
    HAVING COUNT(j.id) > ${FREE_ACTIVE_JOB_LIMIT}
  `;

  if (usersWithJobs.length === 0) {
    console.log("No recruiters have extra active jobs. Nothing to do.");
    return;
  }

  console.log(`Found ${usersWithJobs.length} recruiter(s) with extra active jobs.\n`);

  for (const recruiter of usersWithJobs) {
    const jobs = await prisma.job.findMany({
      where: { recruiterId: recruiter.id, status: "OPEN" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true },
    });

    const keepJob = jobs[0];
    const extraJobs = jobs.slice(1);

    if (extraJobs.length === 0) continue;

    console.log(`Recruiter: ${recruiter.email ?? "N/A"}`);
    console.log(`  Keeping: ${keepJob?.title ?? "N/A"} (ID: ${keepJob?.id})`);

    await prisma.job.updateMany({
      where: { id: { in: extraJobs.map((j) => j.id) } },
      data: { status: "PAUSED" },
    });

    console.log(`  Paused: ${extraJobs.map((j) => j.title).join(", ")}`);
    console.log(`  IDs: ${extraJobs.map((j) => j.id).join(", ")}\n`);
  }

  console.log("Trial expiry handling complete.");
}

endRecruiterTrial()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());