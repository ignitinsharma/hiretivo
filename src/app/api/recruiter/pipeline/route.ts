/*
 * GET /api/recruiter/pipeline
 * Returns all applications for the authenticated recruiter's jobs,
 * grouped by status into 6 columns (APPLIED/REVIEWING/INTERVIEW/OFFER/HIRED/REJECTED).
 * Name blur: if no EngineerUnlock record exists for this recruiter+engineer pair,
 * returns blurredName (first initial + last initial) instead of full name.
 * Auth: RECRUITER role required.
 * Rate limited: 30 req/min per user.
 * Returns: { columns: Record<AppStatus, PipelineCard[]> }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter } from "@/lib/rate-limit";

interface PipelineCard {
  id: string;
  engineerId: string;
  engineerName: string;
  isBlurred: boolean;
  jobTitle: string;
  matchScore: number;
  appliedAt: string;
  status: string;
}

/*
 * blurName
 * Returns first initial + last initial from a full name.
 * Falls back to first 2 chars + "." for single-word names.
 */
function blurName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0).toUpperCase() + ". " + parts[parts.length - 1].charAt(0).toUpperCase() + ".";
  }
  return fullName.slice(0, 2).toUpperCase() + ".";
}

const COLUMN_KEYS = ["APPLIED", "REVIEWING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;

export async function GET(_req: NextRequest) {
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

  const [applications, unlocks] = await Promise.all([
    prisma.application.findMany({
      where: { job: { recruiterId } },
      include: {
        job: { select: { title: true } },
        seeker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.engineerUnlock.findMany({
      where: { recruiterId },
      select: { engineerId: true },
    }),
  ]);

  const unlockedIds = new Set(unlocks.map((u) => u.engineerId));

  const cards: PipelineCard[] = applications.map((app) => {
    const seekerName = app.seeker.name ?? "Unknown";
    const isBlurred = !unlockedIds.has(app.seeker.id);
    return {
      id: app.id,
      engineerId: app.seeker.id,
      engineerName: isBlurred ? blurName(seekerName) : seekerName,
      isBlurred,
      jobTitle: app.job.title,
      matchScore: app.matchScore,
      appliedAt: app.createdAt.toISOString(),
      status: app.status,
    };
  });

  const columns: Record<string, PipelineCard[]> = {};
  for (const key of COLUMN_KEYS) {
    columns[key] = [];
  }
  for (const card of cards) {
    const col = columns[card.status];
    if (col) {
      col.push(card);
    }
  }

  return NextResponse.json({ columns });
}
