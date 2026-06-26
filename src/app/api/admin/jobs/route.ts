import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { adminJobCreateSchema } from "@/lib/validations/admin-job.schema";
import { ApplyType, JobStatus, SkillLevel } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";

const adminWriteLimiter = createRateLimiter("admin-write", 30, "1 m");
const adminReadLimiter = createRateLimiter("admin-read", 60, "1 m");

/*
 * GET /api/admin/jobs
 * Lists admin-posted jobs with offset pagination, optionally filtered by status.
 * Query params: status (optional), page (default 1), limit (default 20)
 * Returns 403 for non-admin sessions. 429 on rate limit.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await adminReadLimiter.limit(session!.user!.id!);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = req.nextUrl.searchParams;
  const status = params.get("status") ?? undefined;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isAdminPosted: true };
  if (status && status !== "ALL") where.status = status;

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        companyName: true,
        companyLogoUrl: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      companyName: j.companyName,
      companyLogoUrl: j.companyLogoUrl,
      status: j.status,
      createdAt: j.createdAt,
      publishedAt: j.publishedAt,
      applicantCount: j._count.applications,
    })),
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    },
  });
}

/*
 * POST /api/admin/jobs
 * Creates a new admin-posted job as DRAFT.
 * Forces applyType=EXTERNAL and isAdminPosted=true.
 * Skips plan limits and email verification.
 * Returns 201 with created job, 403 non-admin, 400 validation error, 429 rate-limit.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await adminWriteLimiter.limit(session!.user!.id!);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminJobCreateSchema.safeParse(body);
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
    externalApplyUrl,
    ...jobFields
  } = parsed.data;

  const normalized = {
    ...jobFields,
    companyLogoUrl: companyLogoUrl || null,
    companyWebsite: companyWebsite || null,
    companySize: companySize || null,
    companyIndustry: companyIndustry || null,
    companyFunding: companyFunding || null,
    externalApplyUrl: externalApplyUrl || null,
  };

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.job.create({
      data: {
        ...normalized,
        recruiterId: session!.user!.id!,
        status: JobStatus.DRAFT,
        applyType: ApplyType.EXTERNAL,
        isAdminPosted: true,
      },
    });
    await tx.jobSkill.createMany({
      data: skills.map((s) => ({
        jobId: created.id,
        skillId: s.skillId,
        level: s.level ?? SkillLevel.INTERMEDIATE,
      })),
    });
    return created;
  });

  return NextResponse.json({ job }, { status: 201 });
}
