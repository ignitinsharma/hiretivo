"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

type RoleResult = { success: true; redirectTo: string } | { success: false; error: string };

export async function setUserRole(role: "SEEKER" | "RECRUITER"): Promise<RoleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (role !== "SEEKER" && role !== "RECRUITER") {
    return { success: false, error: "Invalid role" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: role as Role },
  });

  const redirectTo = role === "SEEKER" ? "/seeker/onboarding" : "/recruiter/onboarding";
  return { success: true, redirectTo };
}
