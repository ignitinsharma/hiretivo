import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillLevel, UserRole } from "@/constants/enums";
import { invalidateSeekerCache } from "@/lib/match";
import { resolveLogoUrl } from "@/lib/r2";
import { getProfileStrengthSummary } from "@/lib/seeker-dashboard";
import { SeekerSettingsSchema } from "@/lib/validations/seeker.schema";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, dataFetchRateLimiter } from "@/lib/rate-limit";
import { parseLegacyLocation, isValidState, isValidCity, formatLocation } from "@/modules/india-location";
import type { IndiaState } from "@/modules/india-location";
import type { Prisma } from "@prisma/client";
import {
  canonicalizeSkillName,
  slugifySkillName as slugifyCanonicalSkillName,
  uniqueCanonicalSkillNames,
} from "@/lib/skills/canonicalize";

const settingsRateLimiter = createRateLimiter("seeker-settings", 20, "1 m");

const SITUATION_VALUE_MAP: Record<string, string> = {
  ACTIVELY_LOOKING: "ACTIVELY_LOOKING",
  "ACTIVELY LOOKING": "ACTIVELY_LOOKING",
  "OPEN_TO_OFFERS": "OPEN_TO_OFFERS",
  "OPEN TO OFFERS": "OPEN_TO_OFFERS",
  EXPLORING_OPTIONS: "EXPLORING_OPTIONS",
  "EXPLORING OPTIONS": "EXPLORING_OPTIONS",
  STUDENT_FRESH_GRAD: "STUDENT_FRESH_GRAD",
  "STUDENT FRESH GRAD": "STUDENT_FRESH_GRAD",
  "STUDENT / FRESH GRAD": "STUDENT_FRESH_GRAD",
  "STUDENT/FRESH GRAD": "STUDENT_FRESH_GRAD",
};

const AVAILABILITY_VALUE_MAP: Record<string, string> = {
  IMMEDIATELY: "IMMEDIATELY",
  TWO_WEEKS: "TWO_WEEKS",
  "TWO WEEKS": "TWO_WEEKS",
  "2 WEEKS": "TWO_WEEKS",
  "2 WEEKS NOTICE": "TWO_WEEKS",
  ONE_MONTH_PLUS: "ONE_MONTH_PLUS",
  "ONE MONTH PLUS": "ONE_MONTH_PLUS",
  "1 MONTH": "ONE_MONTH_PLUS",
  "1 MONTH+": "ONE_MONTH_PLUS",
  "1 MONTH PLUS": "ONE_MONTH_PLUS",
};

interface SkillCandidate {
  id: string;
  name: string;
  slug: string;
}

/*
 * normalizeProfileSelectValue
 * Converts legacy display labels into canonical enum-like strings.
 * Returns null for blank values and preserves unknown non-blank values.
 */
function normalizeProfileSelectValue(
  value: string | null | undefined,
  valueMap: Record<string, string>,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const lookupKey = trimmedValue.replace(/[_-]+/g, " ").toUpperCase();
  return valueMap[trimmedValue.toUpperCase()] ?? valueMap[lookupKey] ?? trimmedValue;
}

/*
 * normalizeSkillName
 * Trims and collapses whitespace in user-entered skill names.
 * Returns the canonical display name used for matching and creation.
 */
function normalizeSkillName(name: string): string {
  return canonicalizeSkillName(name);
}

/*
 * slugifySkillName
 * Converts a normalized skill name into a stable URL-safe slug.
 * Returns a fallback slug for names without alphanumeric characters.
 */
function slugifySkillName(name: string): string {
  return slugifyCanonicalSkillName(name);
}

/*
 * uniqueSkillNames
 * Deduplicates skill names case-insensitively while preserving first-seen casing.
 * Returns normalized names in the original input order.
 */
function uniqueSkillNames(names: string[]): string[] {
  return uniqueCanonicalSkillNames(names);
}

/*
 * uniqueSkillIds
 * Deduplicates skill ids while preserving first-seen order.
 * Returns a unique skill id list for profile replacement.
 */
function uniqueSkillIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  ids.forEach((id) => {
    if (seen.has(id)) return;
    seen.add(id);
    result.push(id);
  });
  return result;
}

/*
 * resolveSkillIdsFromNames
 * Finds or creates skills from user-entered names for seeker settings.
 * Returns unique skill ids ready for seeker profile association.
 */
async function resolveSkillIdsFromNames(skillNames: string[]): Promise<string[]> {
  const names = uniqueSkillNames(skillNames);
  const skillIds: string[] = [];

  for (const normalizedName of names) {
    const slug = slugifySkillName(normalizedName);
    const existingSkill = await findSkillBySlugOrName(normalizedName, slug);

    if (existingSkill) {
      skillIds.push(await updateSkillNameIfSafe(existingSkill, normalizedName));
      continue;
    }

    try {
      const skill = await prisma.skill.create({
        data: {
          name: normalizedName,
          slug,
          category: "Profile",
        },
        select: { id: true },
      });
      skillIds.push(skill.id);
    } catch (error: unknown) {
      if (!isPrismaUniqueConstraintError(error)) {
        throw error;
      }

      const skill = await findSkillBySlugOrName(normalizedName, slug);
      if (!skill) {
        throw error;
      }

      skillIds.push(await updateSkillNameIfSafe(skill, normalizedName));
    }
  }

  return uniqueSkillIds(skillIds);
}

/*
 * isPrismaUniqueConstraintError
 * Detects Prisma unique constraint errors without relying on `any`.
 * Returns true when the error code is P2002.
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

/*
 * isPrismaForeignKeyConstraintError
 * Detects stale relation ids that cannot be connected during profile saves.
 */
function isPrismaForeignKeyConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  );
}

/*
 * findSkillBySlugOrName
 * Looks up an existing skill by generated slug or case-insensitive name.
 * Returns the earliest matching skill candidate or null.
 */
async function findSkillBySlugOrName(
  normalizedName: string,
  slug: string,
): Promise<SkillCandidate | null> {
  const skills = await prisma.skill.findMany({
    where: {
      OR: [
        { slug },
        { name: { equals: normalizedName, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    skills.find((skill) => skill.slug === slug) ??
    skills.find(
      (skill) => skill.name.toLowerCase() === normalizedName.toLowerCase(),
    ) ??
    null
  );
}

/*
 * updateSkillNameIfSafe
 * Updates skill casing when it will not conflict with another skill.
 * Returns the skill id whether or not a display-name update was needed.
 */
async function updateSkillNameIfSafe(
  skill: SkillCandidate,
  normalizedName: string,
): Promise<string> {
  if (
    skill.name === normalizedName ||
    skill.name.toLowerCase() !== normalizedName.toLowerCase()
  ) {
    return skill.id;
  }

  const conflictingSkill = await prisma.skill.findFirst({
    where: {
      name: normalizedName,
      NOT: { id: skill.id },
    },
    select: { id: true },
  });

  if (conflictingSkill) {
    return skill.id;
  }

  const updatedSkill = await prisma.skill.update({
    where: { id: skill.id },
    data: { name: normalizedName },
    select: { id: true },
  });

  return updatedSkill.id;
}

/*
 * GET /api/seeker/settings
 * Returns the authenticated seeker's profile, skills, work, and education settings.
 * Responds with settings data or auth/not-found/rate-limit errors.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          location: true,
          situation: true,
          primaryRole: true,
          workPreference: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          resumeKey: true,
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          twitterUrl: true,
          yearsExperience: true,
          workExperiences: {
            orderBy: { createdAt: 'asc' as const },
          },
          educations: {
            orderBy: { createdAt: 'asc' as const },
          },
          skills: {
            include: {
              skill: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { seekerProfile, image, ...userFields } = user;
  const { skills, workExperiences, educations, ...profileFields } = seekerProfile;

  const { city, state: derivedState } = parseLegacyLocation(profileFields.location);

  return NextResponse.json({
    data: {
      ...userFields,
      image: resolveLogoUrl(image),
      ...profileFields,
      situation: normalizeProfileSelectValue(
        profileFields.situation,
        SITUATION_VALUE_MAP,
      ),
      availability: normalizeProfileSelectValue(
        profileFields.availability,
        AVAILABILITY_VALUE_MAP,
      ),
      city,
      state: derivedState,
      skills: skills.map((s) => s.skill),
      workExperiences,
      educations,
      profileStrength: getProfileStrengthSummary(profileFields),
    },
  });
}

/*
 * PATCH /api/seeker/settings
 * Updates the authenticated seeker's account, profile, skills, work, and education settings.
 * Returns the refreshed settings payload or validation/auth/rate-limit errors.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await settingsRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = SeekerSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, skillIds, skillNames, workExperiences: _we, educations: _edu, ...profileData } = parsed.data;

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    const nextSkillIds = skillNames
      ? await resolveSkillIdsFromNames(skillNames)
      : skillIds;

    const transactionOperations: Prisma.PrismaPromise<unknown>[] = [];

    if (name !== undefined) {
      transactionOperations.push(
        prisma.user.update({
          where: { id: session.user.id },
          data: { name },
        }),
      );
    }

    const profileUpdateData: Prisma.SeekerProfileUpdateInput = {};

    if (profileData.headline !== undefined) {
      profileUpdateData.headline = profileData.headline || null;
    }
    if (profileData.bio !== undefined) {
      profileUpdateData.bio = profileData.bio || null;
    }
    if (profileData.city !== undefined || profileData.state !== undefined) {
      if (
        profileData.city &&
        profileData.state &&
        isValidCity(profileData.city) &&
        isValidState(profileData.state)
      ) {
        profileUpdateData.location = formatLocation(
          profileData.city,
          profileData.state as IndiaState,
        );
      } else if (!profileData.city && !profileData.state) {
        profileUpdateData.location = null;
      }
    }
    if (profileData.situation !== undefined) {
      profileUpdateData.situation = normalizeProfileSelectValue(
        profileData.situation,
        SITUATION_VALUE_MAP,
      );
    }
    if (profileData.primaryRole !== undefined) {
      profileUpdateData.primaryRole = profileData.primaryRole || null;
    }
    if (profileData.salaryMin !== undefined) {
      profileUpdateData.salaryMin = profileData.salaryMin;
    }
    if (profileData.salaryMax !== undefined) {
      profileUpdateData.salaryMax = profileData.salaryMax;
    }
    if (profileData.currency !== undefined) {
      profileUpdateData.currency = profileData.currency || null;
    }
    if (profileData.availability !== undefined) {
      profileUpdateData.availability = normalizeProfileSelectValue(
        profileData.availability,
        AVAILABILITY_VALUE_MAP,
      );
    }
    if (profileData.websiteUrl !== undefined) {
      profileUpdateData.websiteUrl = profileData.websiteUrl || null;
    }
    if (profileData.linkedinUrl !== undefined) {
      profileUpdateData.linkedinUrl = profileData.linkedinUrl || null;
    }
    if (profileData.githubUrl !== undefined) {
      profileUpdateData.githubUrl = profileData.githubUrl || null;
    }
    if (profileData.twitterUrl !== undefined) {
      profileUpdateData.twitterUrl = profileData.twitterUrl || null;
    }
    if (profileData.yearsExperience !== undefined) {
      profileUpdateData.yearsExperience = profileData.yearsExperience;
    }

    if (Object.keys(profileUpdateData).length > 0) {
      transactionOperations.push(
        prisma.seekerProfile.update({
          where: { userId: session.user.id },
          data: profileUpdateData,
        }),
      );
    }

    if (nextSkillIds) {
      transactionOperations.push(
        prisma.seekerSkill.deleteMany({
          where: { seekerProfileId: seekerProfile.id },
        }),
        ...nextSkillIds.map((skillId) =>
          prisma.seekerSkill.create({
            data: {
              seekerProfileId: seekerProfile.id,
              skillId,
              level: SkillLevel.INTERMEDIATE,
            },
          }),
        ),
      );
    }

    if (parsed.data.workExperiences !== undefined) {
      transactionOperations.push(
        prisma.workExperience.deleteMany({
          where: { seekerProfileId: seekerProfile.id },
        }),
        ...parsed.data.workExperiences.map((exp) =>
          prisma.workExperience.create({
            data: {
              seekerProfileId: seekerProfile.id,
              company: exp.company,
              title: exp.title,
              startDate: exp.startDate,
              endDate: exp.endDate ?? null,
              isCurrent: exp.isCurrent,
              description: exp.description ?? null,
              positionType: exp.positionType ?? null,
              skills: exp.skills,
            },
          }),
        ),
      );
    }

    if (parsed.data.educations !== undefined) {
      transactionOperations.push(
        prisma.education.deleteMany({
          where: { seekerProfileId: seekerProfile.id },
        }),
        ...parsed.data.educations.map((edu) =>
          prisma.education.create({
            data: {
              seekerProfileId: seekerProfile.id,
              institution: edu.institution,
              graduationDate: edu.graduationDate ?? null,
              degree: edu.degree ?? null,
              major: edu.major ?? null,
            },
          }),
        ),
      );
    }

    await prisma.$transaction(transactionOperations);

    if (nextSkillIds) {
      await invalidateSeekerCache(seekerProfile.id);
    }

    return NextResponse.json({ data: { success: true } }, { status: 200 });
  } catch (error) {
    console.error("[seeker-settings] update failed:", error);
    if (isPrismaUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "One or more selected skills were duplicated. Please refresh and try again." },
        { status: 409 },
      );
    }
    if (isPrismaForeignKeyConstraintError(error)) {
      return NextResponse.json(
        { error: "One or more selected skills no longer exist. Please refresh and try again." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to update profile settings" }, { status: 500 });
  }
}
