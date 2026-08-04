"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function setUserRole(): Promise<{ success: true; redirectTo: string } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "SEEKER" as Role, onboardingStep: 1 },
  });
  await unstable_update({ user: { role: "SEEKER" as Role, onboardingStep: 1 } });

  return { success: true, redirectTo: "/seeker/onboarding" };
}
