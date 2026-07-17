"use server";

import { auth, unstable_update } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { step1Schema } from "@/lib/validations/onboarding.schema";

type ActionResult = { success: true } | { success: false; error: string };
type CompleteSeekerOnboardingResult =
  | { success: true; redirectTo: "/dashboard" }
  | { success: false; error: string };

export async function saveStep1(data: {
  name: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string | null;
  portfolioUrl: string | null;
  situation: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = step1Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, phone, linkedinUrl, githubUrl, portfolioUrl, situation } = parsed.data as {
    name: string; phone: string; linkedinUrl: string; githubUrl: string | null; portfolioUrl: string | null; situation: string;
  };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    }),
    prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        phone,
        linkedinUrl,
        githubUrl: githubUrl || null,
        websiteUrl: portfolioUrl || null,
        situation,
      },
      update: {
        phone,
        linkedinUrl,
        githubUrl: githubUrl || null,
        websiteUrl: portfolioUrl || null,
        situation,
      },
    }),
  ]);

  await unstable_update({
    user: { name },
  });

  return { success: true };
}

export async function completeSeekerOnboarding(): Promise<CompleteSeekerOnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { situation: true },
  });

  if (!profile?.situation) {
    return { success: false, error: "Complete your current situation first." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true, onboardingStep: null },
  });

  await unstable_update({
    user: { onboardingCompleted: true, onboardingStep: null },
  });

  return { success: true, redirectTo: "/dashboard" };
}
