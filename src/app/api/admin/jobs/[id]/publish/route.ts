import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { invalidateJobSkillsCache } from "@/lib/match";
import { JobStatus } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";

const adminWriteLimiter = createRateLimiter("admin-write", 30, "1 m");

/*
 * POST /api/admin/jobs/[id]/publish
 * Transitions an admin DRAFT job to OPEN and sets publishedAt to now.
 * Validates required fields before publishing: companyName, externalApplyUrl, and at least one skill.
 * Returns 200 with updated job, 400 for missing required fields, 403 non-admin, 404 not found, 429 rate-limit.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await adminWriteLimiter.limit(session!.user!.id!);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { skills: { select: { id: true } } },
  });

  if (!job || !job.isAdminPosted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!job.companyName) {
    return NextResponse.json(
      { error: "Company name required to publish" },
      { status: 400 },
    );
  }
  if (!job.externalApplyUrl) {
    return NextResponse.json(
      { error: "Apply URL required to publish" },
      { status: 400 },
    );
  }
  if (job.skills.length === 0) {
    return NextResponse.json(
      { error: "At least one skill required to publish" },
      { status: 400 },
    );
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: { status: JobStatus.OPEN, publishedAt: new Date() },
  });

  await invalidateJobSkillsCache(params.id);

  return NextResponse.json({ job: updated });
}
