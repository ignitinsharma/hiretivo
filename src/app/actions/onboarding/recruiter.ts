"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recruiterProfileSchema, createJobFromOnboardingSchema } from "@/lib/validations/onboarding.schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function saveRecruiterProfile(data: {
  companyName: string;
  website: string | null;
  companySize: string | null;
  bio?: string | null;
  industry?: string | null;
  fundingType?: string | null;
  isFullyRemote?: boolean;
  logo?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = recruiterProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  await prisma.recruiterProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      companyName: parsed.data.companyName,
      website: parsed.data.website ?? null,
      companySize: parsed.data.companySize ?? null,
      bio: parsed.data.bio ?? null,
      industry: parsed.data.industry ?? null,
      fundingType: parsed.data.fundingType ?? null,
      isFullyRemote: parsed.data.isFullyRemote ?? false,
      logo: parsed.data.logo ?? null,
    },
    update: {
      companyName: parsed.data.companyName,
      website: parsed.data.website ?? null,
      companySize: parsed.data.companySize ?? null,
      bio: parsed.data.bio ?? null,
      industry: parsed.data.industry ?? null,
      fundingType: parsed.data.fundingType ?? null,
      isFullyRemote: parsed.data.isFullyRemote ?? false,
      logo: parsed.data.logo ?? null,
    },
  });

  return { success: true };
}

// --- Create Job from Onboarding (Step 3) ---
export async function createJobFromOnboarding(data: {
  title: string;
  description: string;
  jobType: string;
  experienceLevel: string | null;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
}): Promise<ActionResult & { jobId?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createJobFromOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const job = await prisma.job.create({
      data: {
        recruiterId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        jobType: parsed.data.jobType,
        applyType: "INTERNAL",
        status: "OPEN",
        salaryMin: parsed.data.salaryMin,
        salaryMax: parsed.data.salaryMax,
        currency: "USD",
        experienceLevel: parsed.data.experienceLevel,
        category: parsed.data.category,
      },
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("[createJobFromOnboarding] Failed to create job:", error);
    return { success: false, error: "Failed to create job listing" };
  }
}
