import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { SeekerOnboardingContainer } from "@/modules/seeker-onboarding";
import { resolveSeekerOnboardingStep } from "@/lib/onboarding/progress";
import type {
  SeekerOnboardingStep,
  SeekerSituation,
} from "@/modules/seeker-onboarding/types/seeker-onboarding.types";

export default async function SeekerOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/seeker/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
      verificationStatus: true,
      name: true,
      email: true,
      seekerProfile: {
        select: {
          situation: true,
          phone: true,
          linkedinUrl: true,
          githubUrl: true,
          websiteUrl: true,
          resumeKey: true,
        },
      },
    },
  });

  if (
    user?.onboardingCompleted === true &&
    user?.verificationStatus !== "NOT_SUBMITTED" &&
    user?.verificationStatus !== "REJECTED"
  ) {
    redirect("/dashboard");
  }

  const profile = user?.seekerProfile;

  const initialStep: SeekerOnboardingStep = resolveSeekerOnboardingStep(
    user?.onboardingStep,
    profile ? { situation: profile.situation } : null,
  );

  return (
    <>
      <EmailVerificationBanner />
      <SeekerOnboardingContainer
        initialStep={initialStep}
        initialData={{
          userName: user?.name ?? "",
          userEmail: user?.email ?? "",
          step1: {
            name: user?.name ?? "",
            phone: profile?.phone ?? "",
            linkedinUrl: profile?.linkedinUrl ?? "",
            githubUrl: profile?.githubUrl ?? null,
            portfolioUrl: profile?.websiteUrl ?? null,
            situation: profile?.situation as SeekerSituation | null | undefined,
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
        }}
      />
    </>
  );
}
