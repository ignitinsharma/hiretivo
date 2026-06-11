import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, JobStatus, ApplicationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { format, subDays, isValid } from "date-fns";

/*
 * fillMissingDays
 * Pads application trend data with zero-count days for chart rendering.
 * Returns a fixed-length chronological daily series.
 */
function fillMissingDays(
  data: Array<{ date: string; count: number }>,
  days: number = 30,
): Array<{ date: string; count: number }> {
  const result: Array<{ date: string; count: number }> = [];
  const map = new Map(
    data.map((d) => {
      let parsedDate: Date;
      if (typeof d.date === 'string') {
        parsedDate = new Date(d.date);
      } else if (typeof d.date === 'object' && d.date !== null) {
        parsedDate = new Date(d.date as unknown as string);
      } else {
        parsedDate = new Date();
      }

      const dateStr = isValid(parsedDate)
        ? format(parsedDate, 'yyyy-MM-dd')
        : String(d.date).split('T')[0];
      return [dateStr, d.count];
    }),
  );

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, 'yyyy-MM-dd');
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

/*
 * GET /api/recruiter/dashboard
 * Builds recruiter dashboard metrics, trends, recent applicants, and jobs.
 * Returns dashboard data or auth/rate-limit errors.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const recruiterId = session.user.id;

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeJobsCount,
    totalApplications,
    newThisWeek,
    avgMatchScoreResult,
    recentApplicants,
    trendDataRaw,
  ] = await Promise.all([
    prisma.job.count({
      where: { recruiterId, status: JobStatus.OPEN },
    }),
    prisma.application.count({
      where: { job: { recruiterId } },
    }),
    prisma.application.count({
      where: {
        job: { recruiterId },
        createdAt: { gte: oneWeekAgo },
      },
    }),
    prisma.application.aggregate({
      where: { job: { recruiterId } },
      _avg: { matchScore: true },
    }),
    prisma.application.findMany({
      where: { job: { recruiterId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        matchScore: true,
        createdAt: true,
        seeker: {
          select: { name: true, image: true, verificationStatus: true },
        },
        job: {
          select: { title: true },
        },
      },
    }),
    prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "Application"
      WHERE "jobId" IN (SELECT id FROM "Job" WHERE "recruiterId" = ${recruiterId})
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `,
  ]);

  const avgMatchScore = avgMatchScoreResult._avg.matchScore ?? 0;
  const trendData = fillMissingDays(trendDataRaw);

  return NextResponse.json({
    data: {
      activeJobsCount,
      totalApplications,
      newThisWeek,
      avgMatchScore,
      recentApplicants: recentApplicants.map((app) => ({
        id: app.id,
        seekerName: app.seeker.name ?? "Anonymous",
        seekerImage: resolveLogoUrl(app.seeker.image),
        verificationStatus: app.seeker.verificationStatus,
        jobTitle: app.job.title,
        matchScore: app.matchScore,
        status: app.status,
        appliedDate: app.createdAt.toISOString(),
      })),
      trendData,
    },
  });
}
