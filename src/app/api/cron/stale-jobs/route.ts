import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStaleJobNudge } from "@/lib/email/stale-job-nudge";
import { timingSafeEqual } from 'crypto';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_THRESHOLD_DAYS = 30;

// Security fix: Validate CRON_SECRET at module load time
if (!process.env.CRON_SECRET) {
  throw new Error("CRON_SECRET environment variable is required");
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Security fix: Use constant-time comparison to prevent timing attacks
  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;
  if (
    authHeader.length !== expectedHeader.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find jobs that have been OPEN for more than 30 days without applications
  const staleJobs = await prisma.job.findMany({
    where: {
      status: "OPEN",
      createdAt: {
        lt: new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      recruiter: {
        select: {
          email: true,
          name: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  let nudgesSent = 0;
  const errors: string[] = [];

  for (const job of staleJobs) {
    try {
      const daysInactive = Math.floor(
        (Date.now() - job.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      );

      await sendStaleJobNudge({
        recruiterEmail: job.recruiter.email ?? "",
        recruiterName: job.recruiter.name ?? "there",
        jobTitle: job.title,
        daysInactive,
      });

      nudgesSent++;
    } catch (error) {
      errors.push(`Failed to send nudge for job ${job.id}: ${error}`);
    }
  }

  return NextResponse.json({
    success: true,
    nudgesSent,
    totalStaleJobs: staleJobs.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
