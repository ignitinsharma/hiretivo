"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: true } | { success: false; error: string };

export async function saveRecruiterProfile(data: {
  companyName: string;
  website: string | null;
  companySize: string | null;
  bio?: string | null;
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
    },
    update: {
      companyName: data.companyName.trim(),
      website: data.website ?? null,
      companySize: data.companySize ?? null,
      bio: data.bio ?? null,
    },
  });

  return { success: true };
}
