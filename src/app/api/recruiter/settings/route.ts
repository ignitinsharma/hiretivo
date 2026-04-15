import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import {
  RecruiterProfileSettingsSchema,
} from "@/lib/validations/interview.schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

const settingsRateLimiter = createRateLimiter("settings-save", 20, "1 m");

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      recruiterProfile: {
        select: {
          companyName: true,
          bio: true,
        },
      },
    },
  });

  if (!user?.recruiterProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      name: user.name ?? "",
      email: user.email ?? "",
      companyName: user.recruiterProfile.companyName,
      bio: user.recruiterProfile.bio ?? "",
    },
  });
}

const PatchSettingsSchema = RecruiterProfileSettingsSchema;

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await settingsRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = PatchSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const profileData = data as z.infer<typeof RecruiterProfileSettingsSchema>;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: profileData.name },
  });
  await prisma.recruiterProfile.update({
    where: { userId: session.user.id },
    data: {
      companyName: profileData.companyName,
      bio: profileData.bio ?? null,
    },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
