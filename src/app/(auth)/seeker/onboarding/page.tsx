import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { SeekerOnboardingContainer } from "@/modules/seeker-onboarding";
import {
  parseOnboardingDraft,
  resolveSeekerOnboardingStep,
} from "@/lib/onboarding/progress";
import type { SeekerOnboardingStep } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";
import type {
  Availability,
  Currency,
  JobCategory,
  JobType,
  SeekerSituation,
} from "@/modules/seeker-onboarding/types/seeker-onboarding.types";

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
      onboardingDraft: true,
      name: true,
      seekerProfile: {
        select: {
          situation: true,
          primaryRole: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
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
  const draft = parseOnboardingDraft(user?.onboardingDraft);
  const initialStep: SeekerOnboardingStep = resolveSeekerOnboardingStep(
    user?.onboardingStep,
    profile
      ? {
          situation: profile.situation,
          primaryRole: profile.primaryRole,
          availability: profile.availability,
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
            jobType: draft.seeker?.jobType as JobType | null | undefined,
            category: draft.seeker?.category as JobCategory | null | undefined,
            salaryRange: {
              min: profile?.salaryMin ?? null,
              max: profile?.salaryMax ?? null,
              currency: (profile?.currency ?? "USD") as Currency,
            },
            availability: profile?.availability as Availability | null | undefined,
          },
        }}
      />
    </>
  );
}
