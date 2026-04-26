import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import {
  NotificationSettingsSchema,
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
      image: true,
      plan: true,
      billingCustomerId: true,
      recruiterProfile: {
        select: {
          companyName: true,
          bio: true,
          companySize: true,
          industry: true,
          fundingType: true,
          isFullyRemote: true,
          website: true,
          logo: true,
          emailNotifications: true,
          applicationAlerts: true,
          interviewNotifications: true,
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
      image: user.image,
      plan: user.plan,
      billingCustomerId: user.billingCustomerId,
      companyName: user.recruiterProfile.companyName,
      bio: user.recruiterProfile.bio ?? "",
      companySize: user.recruiterProfile.companySize ?? "",
      industry: user.recruiterProfile.industry ?? "",
      fundingType: user.recruiterProfile.fundingType ?? "",
      isFullyRemote: user.recruiterProfile.isFullyRemote,
      website: user.recruiterProfile.website ?? "",
      logo: user.recruiterProfile.logo,
      emailNotifications: user.recruiterProfile.emailNotifications,
      applicationAlerts: user.recruiterProfile.applicationAlerts,
      interviewNotifications: user.recruiterProfile.interviewNotifications,
    },
  });
}

// Combined schema: profile fields OR notification fields
const PatchSettingsSchema = z.union([
  RecruiterProfileSettingsSchema,
  NotificationSettingsSchema,
]);

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limiting — 20 settings saves/min
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

  // Determine which fields to update based on discriminant field
  if ("name" in data) {
    // Profile tab save — discriminated by 'name' field (only in RecruiterProfileSettingsSchema).
    // Cast is safe because Zod has already validated the shape above.
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
        companySize: profileData.companySize ?? null,
        industry: profileData.industry ?? null,
        fundingType: profileData.fundingType ?? null,
        isFullyRemote: profileData.isFullyRemote ?? false,
        website: profileData.website ?? null,
      },
    });
  } else {
    // Notifications tab save
    const notifData = data as z.infer<typeof NotificationSettingsSchema>;
    await prisma.recruiterProfile.update({
      where: { userId: session.user.id },
      data: {
        emailNotifications: notifData.emailNotifications,
        applicationAlerts: notifData.applicationAlerts,
        interviewNotifications: notifData.interviewNotifications,
      },
    });
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
