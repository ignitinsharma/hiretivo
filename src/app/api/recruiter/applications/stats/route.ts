import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { searchRateLimiter } from "@/lib/rate-limit";

/*
 * GET /api/recruiter/applications/stats
 * Aggregates application counts by status for the authenticated recruiter.
 * Returns totals for optional job filters or auth/rate-limit errors.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await searchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");

  const where: { job: { recruiterId: string }; jobId?: string } = {
    job: { recruiterId: session.user.id },
  };

  if (jobId) {
    where.jobId = jobId;
  }

  const [total, applied, reviewing, interview, hired] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.count({ where: { ...where, status: ApplicationStatus.APPLIED } }),
    prisma.application.count({ where: { ...where, status: ApplicationStatus.REVIEWING } }),
    prisma.application.count({ where: { ...where, status: ApplicationStatus.INTERVIEW } }),
    prisma.application.count({ where: { ...where, status: ApplicationStatus.HIRED } }),
  ]);

  return NextResponse.json({
    total,
    applied,
    reviewing,
    interview,
    hired,
  });
}
