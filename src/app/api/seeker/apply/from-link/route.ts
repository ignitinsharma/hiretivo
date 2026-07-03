import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, ApplySource, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { fetchJdFromLink } from "@/lib/apply/jd-fetch";
import { computeMatchScore } from "@/lib/match";
import { ApplyFromLinkSchema } from "@/lib/validations/apply-from-link.schema";

/*
 * isPrismaUniqueConstraintError
 * Detects a Prisma unique-constraint violation (P2002) without `any`.
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/*
 * POST /api/seeker/apply/from-link
 * Turns a pasted job URL (or pasted JD text) into a PASTED_LINK Application
 * the wizard can tailor against. Known-ATS URLs reuse the existing
 * normalizer fetchers; unknown/blocked URLs fall back to AI extraction, then
 * to a manual-paste re-prompt. Never creates a duplicate for the same
 * (seekerId, externalJobUrl) — a repeat submit routes back to the existing
 * row instead (mirrors the FEED dedup in /api/seeker/applications).
 * Request body: ApplyFromLinkSchema.
 * Response: {data:{applicationId}} 200 | {needsManualPaste:true, reason} 200
 * | {error} 400/401/403/429/500.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ApplyFromLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { url, pastedText } = parsed.data;
  const seekerId = session.user.id;

  const existing = await prisma.application.findFirst({
    where: { seekerId, externalJobUrl: url },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ data: { applicationId: existing.id } }, { status: 200 });
  }

  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });

  const result = await fetchJdFromLink(url, pastedText ?? null, skills);
  if (!result.ok) {
    return NextResponse.json({ needsManualPaste: true, reason: result.reason }, { status: 200 });
  }

  const matchedSkillIds = skills.filter((s) => result.jd.skills.includes(s.name)).map((s) => s.id);
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: seekerId },
    select: { id: true, skills: { select: { skillId: true } } },
  });
  const matchScore = seekerProfile
    ? computeMatchScore(
        seekerProfile.skills.map((s) => s.skillId),
        matchedSkillIds,
      )
    : 0;

  try {
    const application = await prisma.application.create({
      data: {
        seekerId,
        jobId: null,
        source: ApplySource.PASTED_LINK,
        status: ApplicationStatus.APPLIED,
        matchScore,
        externalJobUrl: url,
        externalTitle: result.jd.title,
        externalCompanyName: result.jd.company,
        externalDescription: result.jd.description,
        externalSkills: result.jd.skills,
      },
      select: { id: true },
    });
    return NextResponse.json({ data: { applicationId: application.id } }, { status: 200 });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      const race = await prisma.application.findFirst({
        where: { seekerId, externalJobUrl: url },
        select: { id: true },
      });
      if (race) return NextResponse.json({ data: { applicationId: race.id } }, { status: 200 });
    }
    throw error;
  }
}
