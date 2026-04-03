"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  if (!data.companyName || data.companyName.trim().length === 0) {
    return { success: false, error: "Company name is required" };
  }

  await prisma.recruiterProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      companyName: data.companyName.trim(),
      website: data.website ?? null,
      companySize: data.companySize ?? null,
      bio: data.bio ?? null,
      industry: data.industry ?? null,
      fundingType: data.fundingType ?? null,
      isFullyRemote: data.isFullyRemote ?? false,
      logo: data.logo ?? null,
    },
    update: {
      companyName: data.companyName.trim(),
      website: data.website ?? null,
      companySize: data.companySize ?? null,
      bio: data.bio ?? null,
      industry: data.industry ?? null,
      fundingType: data.fundingType ?? null,
      isFullyRemote: data.isFullyRemote ?? false,
      logo: data.logo ?? null,
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

  if (!data.title || data.title.trim().length === 0) {
    return { success: false, error: "Job title is required" };
  }

  if (!data.description || data.description.trim().length < 50) {
    return { success: false, error: "Job description must be at least 50 characters" };
  }

  try {
    const job = await prisma.job.create({
      data: {
        recruiterId: session.user.id,
        title: data.title.trim(),
        description: data.description.trim(),
        jobType: data.jobType as any,
        applyType: "INTERNAL",
        status: "OPEN",
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: "USD",
        experienceLevel: data.experienceLevel,
        category: data.category,
      },
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("[createJobFromOnboarding] Failed to create job:", error);
    return { success: false, error: "Failed to create job listing" };
  }
}
