"use server";

import { auth, unstable_update } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

type RoleResult = { success: true; redirectTo: string } | { success: false; error: string };

export async function setUserRole(role: UserRole): Promise<RoleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (role !== UserRole.SEEKER && role !== UserRole.RECRUITER) {
    return { success: false, error: "Invalid role" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: role as Role, onboardingStep: 1 },
  });
  await unstable_update({ user: { role: role as Role, onboardingStep: 1 } });

  const redirectTo = "/seeker/onboarding";
  return { success: true, redirectTo };
}
