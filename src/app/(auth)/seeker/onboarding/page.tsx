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
  ExperienceLevel,
  JobCategory,
  JobType,
  SeekerSituation,
  YearsOfExperience,
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
      verificationStatus: true,
      name: true,
      seekerProfile: {
        select: {
          situation: true,
          primaryRole: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          resumeKey: true,
          headline: true,
          githubUrl: true,
          topProjects: true,
          skills: { select: { skill: { select: { name: true } } } },
          _count: { select: { workExperiences: true } },
        },
      },
    },
  });

  // Only redirect if onboarding is complete AND the profile has been submitted for review
  if (
    user?.onboardingCompleted === true &&
    user?.verificationStatus !== "NOT_SUBMITTED"
  ) {
    redirect("/seeker/dashboard");
  }

  const profile = user?.seekerProfile;
  const draft = parseOnboardingDraft(user?.onboardingDraft);

  // Determine whether the seeker has at least one project in topProjects
  const topProjects = profile?.topProjects as unknown as Array<unknown> | null;
  const hasProjects = Array.isArray(topProjects) && topProjects.length > 0;

  const initialStep: SeekerOnboardingStep = resolveSeekerOnboardingStep(
    user?.onboardingStep,
    profile
      ? {
          situation: profile.situation,
          primaryRole: profile.primaryRole,
          availability: profile.availability,
          skillsCount: profile.skills.length,
          githubUrl: profile.githubUrl,
          hasProjects,
          workExperiencesCount: profile._count.workExperiences,
          resumeKey: profile.resumeKey,
          headline: profile.headline,
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
            experienceLevel: draft.seeker?.experienceLevel as ExperienceLevel | null | undefined,
          },
          step2: {
            primaryRole: profile?.primaryRole ?? "",
            yearsOfExperience: draft.seeker?.yearsOfExperience as
              | YearsOfExperience
              | null
              | undefined,
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
