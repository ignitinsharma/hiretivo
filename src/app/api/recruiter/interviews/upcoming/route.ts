import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InterviewStatus, UserRole } from "@/constants/enums";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

/*
 * GET /api/recruiter/interviews/upcoming
 * Lists the next scheduled interviews for the authenticated recruiter.
 * Returns upcoming interview data or auth/rate-limit errors.
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

  const interviews = await prisma.interview.findMany({
    where: {
      recruiterId: session.user.id,
      status: InterviewStatus.SCHEDULED,
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 4,
    include: {
      application: {
        include: {
          job: { select: { title: true } },
          seeker: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: interviews }, { status: 200 });
}
