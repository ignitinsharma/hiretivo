import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillLevel, UserRole } from "@/constants/enums";
import { invalidateSeekerCache } from "@/lib/match";
import { resolveLogoUrl } from "@/lib/r2";
import { SeekerSettingsSchema } from "@/lib/validations/seeker.schema";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, dataFetchRateLimiter } from "@/lib/rate-limit";
import { resolveCanonicalSlug, slugifySkillInput } from "@/lib/skill-synonyms";
import type { Prisma } from "@prisma/client";

const settingsRateLimiter = createRateLimiter("seeker-settings", 20, "1 m");

interface SkillCandidate {
  id: string;
  name: string;
  slug: string;
}

/*
 * normalizeSkillName
 * Trims and collapses whitespace in user-entered skill names.
 * Returns the canonical display name used for matching and creation.
 */
function normalizeSkillName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/*
 * canonicalSkillSlug
 * Converts a skill name into the canonical slug used across skill pickers.
 */
function canonicalSkillSlug(name: string): string {
  return resolveCanonicalSlug(slugifySkillInput(name));
}

/*
 * uniqueSkillNames
 * Deduplicates skill names by canonical slug while preserving first-seen casing.
 * Returns normalized names in the original input order.
 */
function uniqueSkillNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  names.forEach((name) => {
    const normalized = normalizeSkillName(name);
    const key = canonicalSkillSlug(normalized);
    if (!normalized || seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
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
 * canonicalizeSkillCandidates
 * Replaces old alias skill rows with their canonical display row when present.
 * Prevents settings from rendering duplicate labels like "nextjs" instead of "Next.js".
 */
async function canonicalizeSkillCandidates(
  skills: SkillCandidate[],
): Promise<SkillCandidate[]> {
  const canonicalSlugs = Array.from(
    new Set(skills.map((skill) => canonicalSkillSlug(skill.slug || skill.name))),
  );

  if (canonicalSlugs.length === 0) return [];

  const canonicalSkills = await prisma.skill.findMany({
    where: { slug: { in: canonicalSlugs } },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  const canonicalBySlug = new Map(
    canonicalSkills.map((skill) => [skill.slug, skill]),
  );
  const seenSkillIds = new Set<string>();
  const result: SkillCandidate[] = [];

  for (const skill of skills) {
    const canonicalSlug = canonicalSkillSlug(skill.slug || skill.name);
    const canonicalSkill = canonicalBySlug.get(canonicalSlug) ?? skill;
    if (seenSkillIds.has(canonicalSkill.id)) continue;

    seenSkillIds.add(canonicalSkill.id);
    result.push(canonicalSkill);
  }

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
    const slug = canonicalSkillSlug(normalizedName);
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
  const canonicalSkills = await canonicalizeSkillCandidates(
    skills.map((s) => s.skill),
  );

  return NextResponse.json({
    data: {
      ...userFields,
      image: resolveLogoUrl(image),
      ...profileFields,
      skills: canonicalSkills,
      workExperiences,
      educations,
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

  const nextSkillIds = skillNames
    ? await resolveSkillIdsFromNames(skillNames)
    : skillIds;

  const transactionOperations: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    }),
    prisma.seekerProfile.update({
      where: { userId: session.user.id },
      data: {
        headline: profileData.headline || null,
        bio: profileData.bio || null,
        location: profileData.location || null,
        situation: profileData.situation || null,
        primaryRole: profileData.primaryRole || null,
        salaryMin: profileData.salaryMin ?? null,
        salaryMax: profileData.salaryMax ?? null,
        currency: profileData.currency || null,
        availability: profileData.availability || null,
        websiteUrl: profileData.websiteUrl !== undefined ? (profileData.websiteUrl || null) : undefined,
        linkedinUrl: profileData.linkedinUrl !== undefined ? (profileData.linkedinUrl || null) : undefined,
        githubUrl: profileData.githubUrl !== undefined ? (profileData.githubUrl || null) : undefined,
        twitterUrl: profileData.twitterUrl !== undefined ? (profileData.twitterUrl || null) : undefined,
        yearsExperience: profileData.yearsExperience !== undefined ? profileData.yearsExperience : undefined,
      },
    }),
  ];

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

  const [userUpdate, profileUpdate] = await prisma.$transaction(
    transactionOperations,
  );

  if (nextSkillIds) {
    await invalidateSeekerCache(seekerProfile.id);
  }

  if (!userUpdate || !profileUpdate) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
