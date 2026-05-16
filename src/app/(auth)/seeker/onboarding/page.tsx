import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { SeekerOnboardingContainer } from "@/modules/seeker-onboarding";
import { resolveSeekerOnboardingStep } from "@/lib/onboarding/progress";
import type { SeekerOnboardingStep } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";
import type { SeekerSituation } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";

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
      onboardingStep: true,
      name: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          situation: true,
          primaryRole: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          yearsExperience: true,
          resumeKey: true,
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
  });
  if (user?.onboardingCompleted === true) {
    redirect("/seeker/dashboard");
  }

  const profile = user?.seekerProfile;
  const initialStep: SeekerOnboardingStep = resolveSeekerOnboardingStep(
    user?.onboardingStep,
    profile
      ? {
          situation: profile.situation,
          primaryRole: profile.primaryRole,
          salaryMinUsd: profile.salaryMinUsd,
          skillsCount: profile.skills.length,
        }
      : null,
  );

  return (
    <>
      <EmailVerificationBanner />
      <SeekerOnboardingContainer
        initialStep={initialStep}
        initialData={{
          userName: user?.name?.split(" ")[0] ?? "there",
          step1: {
            situation: profile?.situation as SeekerSituation | null | undefined,
          },
          step2: {
            primaryRole: profile?.primaryRole ?? "",
            yearsOfExperience: profile?.yearsExperience ?? null,
            skills: profile?.skills.map(({ skill }) => skill.name) ?? [],
          },
          step3: {
            resume: profile?.resumeKey
              ? {
                  name: profile.resumeKey.split("/").pop() ?? "Resume",
                  size: 0,
                  type: "application/octet-stream",
                  key: profile.resumeKey,
                  url: null,
                  file: null,
                }
              : null,
          },
          step4: {
            targetSalaryMin: profile?.salaryMinUsd ?? null,
            targetSalaryMax: profile?.salaryMaxUsd ?? null,
            timezoneOverlapHours: user?.timezoneOverlapHours ?? null,
            availableFrom: user?.availableFrom
              ? user.availableFrom.toISOString().slice(0, 10)
              : null,
          },
        }}
      />
    </>
  );
}
