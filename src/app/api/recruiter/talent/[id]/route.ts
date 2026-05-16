import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/*
 * GET /api/recruiter/talent/[id]
 * Returns single engineer detail in locked or unlocked shape.
 * Locked: firstName/lastInitial + metadata. Unlocked: adds fullName/email/github/linkedin/resumeUrl.
 * Returns 404 if engineer not VERIFIED+profilePublic or hiddenUntil active.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER)
    return new Response("Forbidden", { status: 403 });

  const ip = getRateLimitIp(req);
  const { success } = await dataFetchRateLimiter.limit(ip);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!canAccessTalentPool(recruiter?.plan)) {
    return NextResponse.json({ code: "UPGRADE_REQUIRED" }, { status: 403 });
  }

  const engineer = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "SEEKER",
      verificationStatus: "VERIFIED",
      seekerProfile: { is: { profilePublic: true } },
      AND: [
        { OR: [{ hiddenUntil: null }, { hiddenUntil: { lt: new Date() } }] },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      hiretivoScore: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          yearsExperience: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          githubUrl: true,
          linkedinUrl: true,
          resumeKey: true,
          skills: {
            select: {
              skill: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!engineer) return new Response("Not Found", { status: 404 });

  const [unlock, savedRecord] = await Promise.all([
    prisma.engineerUnlock.findUnique({
      where: {
        recruiterId_engineerId: {
          recruiterId: session.user.id,
          engineerId: params.id,
        },
      },
    }),
    prisma.savedEngineer.findUnique({
      where: {
        recruiterId_engineerId: {
          recruiterId: session.user.id,
          engineerId: params.id,
        },
      },
    }),
  ]);

  const profile = engineer.seekerProfile;
  const nameParts = (engineer.name ?? "").split(" ");
  const firstName = nameParts[0] ?? "";
  const lastInitial =
    nameParts.length > 1
      ? (nameParts[nameParts.length - 1]?.[0] ?? "")
      : "";

  const base = {
    id: engineer.id,
    firstName,
    lastInitial,
    hiretivoScore: engineer.hiretivoScore ?? 0,
    role: profile?.primaryRole ?? "",
    yearsExperience: profile?.yearsExperience ?? 0,
    skills: profile?.skills.map((s) => s.skill.name) ?? [],
    salaryMinUsd: profile?.salaryMinUsd ?? 0,
    salaryMaxUsd: profile?.salaryMaxUsd ?? 0,
    timezoneOverlapHours: engineer.timezoneOverlapHours ?? 0,
    availableFrom: engineer.availableFrom?.toISOString() ?? null,
    isUnlocked: !!unlock,
    isSaved: !!savedRecord,
  };

  if (!unlock) return NextResponse.json({ data: base });

  return NextResponse.json({
    data: {
      ...base,
      fullName: engineer.name ?? "",
      email: engineer.email ?? "",
      githubUrl: profile?.githubUrl ?? null,
      linkedinUrl: profile?.linkedinUrl ?? null,
      resumeUrl: profile?.resumeKey
        ? resolveLogoUrl(profile.resumeKey)
        : null,
    },
  });
}
