import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { adminJobUpdateSchema } from "@/lib/validations/admin-job.schema";
import { invalidateJobSkillsCache } from "@/lib/match";
import { JobStatus, SkillLevel } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";

const adminWriteLimiter = createRateLimiter("admin-write", 30, "1 m");

/*
 * GET /api/admin/jobs/[id]
 * Returns a single admin-posted job with its skills, for the edit page.
 * Returns 403 for non-admin, 404 if not found or not admin-posted.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      skills: {
        select: {
          skillId: true,
          level: true,
          skill: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!job || !job.isAdminPosted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

/*
 * PATCH /api/admin/jobs/[id]
 * Updates an admin-posted job. When skills are provided, replaces the skill set atomically.
 * Invalidates the match cache when skills or status changes.
 * Returns 403 non-admin, 404 not found, 400 validation error, 429 rate-limit.
 */
export async function PATCH(
  req: NextRequest,
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

  const existing = await prisma.job.findUnique({
    where: { id: params.id },
    select: { isAdminPosted: true },
  });
  if (!existing || !existing.isAdminPosted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminJobUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const {
    skills,
    companyLogoUrl,
    companyWebsite,
    companySize,
    companyIndustry,
    companyFunding,
    ...rest
  } = parsed.data;

  const normalized: Record<string, unknown> = { ...rest };
  if (companyLogoUrl !== undefined) normalized.companyLogoUrl = companyLogoUrl || null;
  if (companyWebsite !== undefined) normalized.companyWebsite = companyWebsite || null;
  if (companySize !== undefined) normalized.companySize = companySize || null;
  if (companyIndustry !== undefined) normalized.companyIndustry = companyIndustry || null;
  if (companyFunding !== undefined) normalized.companyFunding = companyFunding || null;

  let updated;
  if (skills !== undefined) {
    updated = await prisma.$transaction(async (tx) => {
      const j = await tx.job.update({ where: { id: params.id }, data: normalized });
      await tx.jobSkill.deleteMany({ where: { jobId: params.id } });
      await tx.jobSkill.createMany({
        data: skills.map((s) => ({
          jobId: params.id,
          skillId: s.skillId,
          level: s.level ?? SkillLevel.INTERMEDIATE,
        })),
      });
      return j;
    });
    await invalidateJobSkillsCache(params.id);
  } else {
    updated = await prisma.job.update({ where: { id: params.id }, data: normalized });
    if ("status" in normalized && normalized.status !== undefined) {
      await invalidateJobSkillsCache(params.id);
    }
  }

  return NextResponse.json({ job: updated });
}

/*
 * DELETE /api/admin/jobs/[id]
 * Soft-deletes an admin-posted job by setting status=DELETED.
 * Removes the job from the seeker feed without destroying data.
 * Returns 403 non-admin, 404 not found, 429 rate-limit.
 */
export async function DELETE(
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

  const existing = await prisma.job.findUnique({
    where: { id: params.id },
    select: { isAdminPosted: true },
  });
  if (!existing || !existing.isAdminPosted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.job.update({
    where: { id: params.id },
    data: { status: JobStatus.DELETED },
  });
  await invalidateJobSkillsCache(params.id);

  return NextResponse.json({ ok: true });
}
