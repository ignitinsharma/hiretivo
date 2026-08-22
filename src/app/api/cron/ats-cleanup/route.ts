import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/constants/enums";
import { subDays } from "date-fns";
import { verifyCronSecret } from "../ats-fetch/_verify-cron-secret";

/*
 * GET /api/cron/ats-cleanup
 * Hard-deletes CLOSED jobs whose closedAt is >30 days ago and have no applications.
 * Triggered via GitHub Actions (curl with Bearer CRON_SECRET) to stay within Hobby 2-cron limit.
 * Watch ATS first (48h unseen → CLOSED, 60d published → CLOSED via autoCloseStaleJobs), then this cleans DB.
 * Total max life: 60d live + 30d closed = 90d, or 48h unseen + 30d. Jobs with any Application never deleted.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = subDays(new Date(), 30);

  const toDelete = await prisma.job.findMany({
    where: {
      status: JobStatus.CLOSED,
      closedAt: { lt: cutoff },
      applications: { none: {} },
    },
    select: { id: true },
  });

  const ids = toDelete.map((j) => j.id);
  if (ids.length === 0) {
    return NextResponse.json({ deleted: 0, ids: [] });
  }

  await prisma.jobSkill.deleteMany({ where: { jobId: { in: ids } } });
  await prisma.jobMatch.deleteMany({ where: { jobId: { in: ids } } });
  const { count } = await prisma.job.deleteMany({ where: { id: { in: ids } } });

  console.log(`[cron:ats-cleanup] deleted ${count} jobs closed before ${cutoff.toISOString()}`);

  return NextResponse.json({ deleted: count, ids });
}
