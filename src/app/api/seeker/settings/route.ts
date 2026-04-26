import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillLevel, UserRole } from "@/constants/enums";
import { invalidateSeekerCache } from "@/lib/match";
import { resolveLogoUrl } from "@/lib/r2";
import { SeekerSettingsSchema } from "@/lib/validations/seeker.schema";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const settingsRateLimiter = createRateLimiter("seeker-settings", 20, "1 m");

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

  const { name, skillIds, ...profileData } = parsed.data;

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

  if (skillIds) {
    await prisma.$transaction([
      prisma.seekerSkill.deleteMany({
        where: { seekerProfileId: seekerProfile.id },
      }),
      ...skillIds.map((skillId) =>
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
