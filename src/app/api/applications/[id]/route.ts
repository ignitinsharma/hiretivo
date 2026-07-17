import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeResumeMatch, type JobSkillInput } from "@/lib/resume-match";
import { diffSummary, diffBullets } from "@/lib/resume-diff";
import type { ResumeDocument, ResumeMatchMeta } from "@/lib/validations/resume.schema";
import { AutomationStatus } from "@/constants/enums";
import { stripHtml } from "@/lib/utils";
import { z } from "zod";

/*
 * GET /api/applications/:id
 * Returns full application detail including job info, active resume version,
 * all resume versions, deterministic matchMeta, and automationStatus.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: {
      id: true,
      status: true,
      matchScore: true,
      generationCount: true,
      activeVersionId: true,
      automationStatus: true,
      failureReason: true,
      createdAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          companyName: true,
          externalApplyUrl: true,
          description: true,
          skills: {
            select: {
              skill: { select: { name: true } },
            },
          },
        },
      },
      resumeVersions: {
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          sourceType: true,
          resumeJson: true,
          createdAt: true,
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const activeVersion = application.resumeVersions.find(
    (v) => v.id === application.activeVersionId,
  );

  const masterResume = await prisma.masterResume.findUnique({
    where: { userId: session.user.id },
    select: { resumeJson: true },
  });

  const masterSkillNames = extractSkillNames(masterResume?.resumeJson);

  const jobSkills: JobSkillInput[] =
    application.job.skills?.map((js) => ({ name: js.skill.name })) ?? [];

  const matchMeta: ResumeMatchMeta | null = activeVersion
    ? computeResumeMatch(
        activeVersion.resumeJson as Parameters<typeof computeResumeMatch>[0],
        jobSkills,
        masterSkillNames,
      )
    : null;

  const masterDoc = masterResume?.resumeJson as ResumeDocument | undefined;
  const activeDoc = activeVersion?.resumeJson as ResumeDocument | undefined;
  const contentDiff = activeDoc && masterDoc
    ? {
        summary: diffSummary(masterDoc.summary, activeDoc.summary),
        bullets: diffBullets(
          masterDoc.experience.flatMap((e) =>
            e.bullets.map((b) => ({ id: b.id, text: b.text })),
          ),
          activeDoc.experience.flatMap((e) => e.bullets),
        ),
      }
    : null;

  return NextResponse.json({
    id: application.id,
    status: application.status,
    matchScore: application.matchScore,
    generationCount: application.generationCount,
    automationStatus: application.automationStatus,
    failureReason: application.failureReason,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    job: {
      ...application.job,
      skills: application.job.skills?.map((js) => js.skill.name) ?? [],
      description: application.job.description
        ? stripHtml(application.job.description)
        : null,
    },
    matchMeta,
    contentDiff,
    activeVersion: activeVersion
      ? {
          id: activeVersion.id,
          version: activeVersion.version,
          sourceType: activeVersion.sourceType,
          resumeJson: activeVersion.resumeJson,
          createdAt: activeVersion.createdAt.toISOString(),
        }
      : null,
    versions: application.resumeVersions.map((v) => ({
      id: v.id,
      version: v.version,
      sourceType: v.sourceType,
      resumeJson: v.resumeJson,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}

/*
 * PATCH /api/applications/:id
 * Supports:
 *   { action: "mark_applied" } — sets automationStatus to SUBMITTED
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = z.object({
    action: z.enum(["mark_applied"]),
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: { id: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (parsed.data.action === "mark_applied") {
    await prisma.application.update({
      where: { id },
      data: { automationStatus: AutomationStatus.SUBMITTED },
    });
  }

  return NextResponse.json({ success: true });
}

function extractSkillNames(resumeJson: unknown): string[] {
  const categories = (resumeJson as { skills?: { categories?: { items: string[] }[] } })
    ?.skills?.categories ?? [];
  return categories.flatMap((c) => c.items ?? []);
}
