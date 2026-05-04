import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { SeekerOnboardingContainer } from "@/modules/seeker-onboarding";
import type { SeekerOnboardingStep } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";

export default async function SeekerOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/seeker/login");
  }
  if (session.user.role !== UserRole.SEEKER) {
    redirect("/recruiter/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      seekerProfile: {
        select: {
          situation: true,
          primaryRole: true,
          availability: true,
          _count: { select: { skills: true } },
        },
      },
    },
  });
  if (user?.onboardingCompleted === true) {
    redirect("/seeker/dashboard");
  }

  const profile = user?.seekerProfile;
  const initialStep: SeekerOnboardingStep =
    !profile?.situation
      ? 1
      : !profile.primaryRole || profile._count.skills === 0
        ? 2
        : !profile.availability
          ? 4
          : 5;

  return <SeekerOnboardingContainer initialStep={initialStep} />;
}
