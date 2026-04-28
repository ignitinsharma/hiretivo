import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillLevel, UserRole } from "@/constants/enums";
import { invalidateSeekerCache } from "@/lib/match";
import { resolveLogoUrl } from "@/lib/r2";
import { SeekerSettingsSchema } from "@/lib/validations/seeker.schema";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const settingsRateLimiter = createRateLimiter("seeker-settings", 20, "1 m");

interface SkillCandidate {
  id: string;
  name: string;
  slug: string;
}

function normalizeSkillName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function slugifySkillName(name: string): string {
  return normalizeSkillName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSkillNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  names.forEach((name) => {
    const normalized = normalizeSkillName(name);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

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

  return skillIds;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

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
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const { skills, ...profileFields } = seekerProfile;

  return NextResponse.json({
    data: {
      ...userFields,
      image: resolveLogoUrl(image),
      ...profileFields,
      skills: skills.map((s) => s.skill),
    },
  });
}

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

  const { name, skillIds, skillNames, ...profileData } = parsed.data;

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [userUpdate, profileUpdate] = await Promise.all([
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
      },
    }),
  ]);

  const nextSkillIds = skillNames
    ? await resolveSkillIdsFromNames(skillNames)
    : skillIds;

  if (nextSkillIds) {
    await prisma.$transaction([
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
    ]);
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
