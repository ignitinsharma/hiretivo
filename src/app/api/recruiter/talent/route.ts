import { auth } from "@/auth";
import { DEMO_THRESHOLD } from "@/constants/demo-engineers";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { coarseLocation, redactName } from "@/lib/billing/talent-redaction";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { searchRateLimiter } from "@/lib/rate-limit";
import { buildTalentQuery } from "@/modules/recruiter/talent/utils/build-talent-query";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

/*
 * parsePositiveInt
 * Parses positive integer query params for pagination.
 * Returns the fallback when the value is missing or invalid.
 */
function parsePositiveInt(rawValue: string | null, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

/*
 * getBioExcerpt
 * Truncates long seeker bios for talent list cards.
 * Returns null for empty bios or a max-length excerpt.
 */
function getBioExcerpt(bio: string | null | undefined): string | null {
  if (!bio) {
    return null;
  }

  return bio.length > 180 ? `${bio.slice(0, 177)}...` : bio;
}


/*
 * GET /api/recruiter/talent
 * Returns talent pool for paid and free recruiters with search/filter/pagination.
 * FREE plan: returns blurred seeker items (name = "First L.", email/image null) + demoCount + isFreePlan:true.
 *   Enables mix-mode in TalentPoolClient without a hard paywall.
 * Paid plans: returns full unblurred talent list + demoCount + isFreePlan:false.
 * demoCount is NOT filtered by search — always reflects total real pool size.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
  }

  const { success } = await searchRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  // Count all seekers with a profile — runs for both FREE and paid paths.
  // Not affected by search filters — always reflects real pool size.
  const demoCount = await prisma.user.count({
    where: { role: "SEEKER", verificationStatus: 'VERIFIED', seekerProfile: { isNot: null } },
  });

  if (!canAccessTalentPool(recruiter?.plan)) {
    // FREE plan: return blurred seeker items (up to DEMO_THRESHOLD) + demoCount.
    // Names are blurred to "First L." server-side. Email and image are nulled.
    // Client uses these alongside DEMO_ENGINEERS static cards for mix-mode grid.
    const blurredSeekers = await prisma.user.findMany({
      where: { role: "SEEKER", verificationStatus: 'VERIFIED', seekerProfile: { isNot: null } },
      take: DEMO_THRESHOLD,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        image: true,
        seekerProfile: {
          select: {
            headline: true,
            location: true,
            yearsExperience: true,
            primaryRole: true,
            availability: true,
            resumeKey: true,
            skills: {
              select: { skill: { select: { name: true } } },
              orderBy: { skill: { name: "asc" } },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        items: blurredSeekers.map((seeker) => {
          const profile = seeker.seekerProfile;
          return {
            id: seeker.id,
            isUnlocked: false, // FREE plan items are always locked
            name: redactName(seeker.name), // server-side mask — real name never sent
            // Talent pool only surfaces verified engineers (WHERE verificationStatus: VERIFIED).
            verificationStatus: VerificationStatus.VERIFIED,
            email: null,      // never expose email on FREE plan
            image: resolveLogoUrl(seeker.image), // real avatar shown on locked card (product decision)
            headline: profile?.headline ?? null,
            bioExcerpt: null, // bio hidden on FREE plan
            location: coarseLocation(profile?.location), // region only — no exact city
            yearsExperience: profile?.yearsExperience ?? null,
            primaryRole: profile?.primaryRole ?? null,
            availability: profile?.availability ?? null,
            resumeKey: false, // resume not accessible on FREE plan
            skills: profile?.skills.map((item) => item.skill.name) ?? [],
          };
        }),
        total: demoCount,
        page: 1,
        limit: DEMO_THRESHOLD,
        demoCount,
        isFreePlan: true,
      },
    });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const skill = url.searchParams.get("skill")?.trim() ?? "";
  const location = url.searchParams.get("location")?.trim() ?? "";
  const availability = url.searchParams.get("availability")?.trim() ?? "";
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const limit = Math.min(
    parsePositiveInt(url.searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  const where = buildTalentQuery({ q, skill, location, availability });

  const [seekers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        seekerProfile: {
          select: {
            headline: true,
            bio: true,
            location: true,
            yearsExperience: true,
            primaryRole: true,
            availability: true,
            resumeKey: true,
            skills: {
              select: {
                skill: { select: { name: true } },
              },
              orderBy: { skill: { name: "asc" } },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Batch-load which engineers this recruiter has already unlocked
  const seekerIds = seekers.map((s) => s.id);
  const existingUnlocks = await prisma.engineerUnlock.findMany({
    where: {
      recruiterId: session.user.id,
      engineerId: { in: seekerIds },
    },
    select: { engineerId: true },
  });
  const unlockedSet = new Set(existingUnlocks.map((u) => u.engineerId));

  return NextResponse.json({
    data: {
      items: seekers.map((seeker) => {
        const profile = seeker.seekerProfile;

        const isUnlocked = unlockedSet.has(seeker.id);

        return {
          id: seeker.id,
          isUnlocked,
          // Talent pool only surfaces verified engineers (WHERE verificationStatus: VERIFIED).
          verificationStatus: VerificationStatus.VERIFIED,
          // Locked: server-side mask — real name never sent until unlocked.
          name: isUnlocked ? seeker.name : redactName(seeker.name),
          email: isUnlocked ? seeker.email : null,
          // Real avatar shown in both states (product decision); residual reverse-image risk accepted.
          image: resolveLogoUrl(seeker.image),
          headline: profile?.headline ?? null,
          bioExcerpt: isUnlocked ? getBioExcerpt(profile?.bio) : null,
          location: isUnlocked ? (profile?.location ?? null) : coarseLocation(profile?.location),
          yearsExperience: profile?.yearsExperience ?? null,
          primaryRole: profile?.primaryRole ?? null,
          availability: profile?.availability ?? null,
          resumeKey: Boolean(profile?.resumeKey),
          skills: profile?.skills.map((item) => item.skill.name) ?? [],
        };
      }),
      total,
      page,
      limit,
      demoCount,
      isFreePlan: false,
    },
  });
}
