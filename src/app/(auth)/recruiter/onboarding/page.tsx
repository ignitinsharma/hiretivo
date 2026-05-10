import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { OnboardingContainer } from "@/modules/onboarding";
import {
  parseOnboardingDraft,
  resolveRecruiterOnboardingStep,
} from "@/lib/onboarding/progress";
import type {
  CompanySize,
  FundingType,
  HiringScale,
  Industry,
  OnboardingStep,
  RecruiterRole,
} from "@/modules/onboarding/types/onboarding.types";

export default async function RecruiterOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/recruiter/login");
  }
  if (session.user.role !== UserRole.RECRUITER) {
    redirect("/seeker/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
      onboardingDraft: true,
      recruiterProfile: {
        select: {
          companyName: true,
          website: true,
          companySize: true,
          industry: true,
          fundingType: true,
          isFullyRemote: true,
          logo: true,
        },
      },
    },
  });
  if (user?.onboardingCompleted === true) {
    redirect("/recruiter/dashboard");
  }

  const draft = parseOnboardingDraft(user?.onboardingDraft);
  const profile = user?.recruiterProfile;
  const initialStep = resolveRecruiterOnboardingStep(user?.onboardingStep, {
    hasCompanyProfile: Boolean(profile),
  });

  return (
    <>
      <EmailVerificationBanner />
      <OnboardingContainer
        initialStep={initialStep as OnboardingStep}
        initialData={{
          step1: {
            role: draft.recruiter?.role as RecruiterRole | null | undefined,
            hiringScale: draft.recruiter?.hiringScale as HiringScale | null | undefined,
          },
          step2: {
            companyName: profile?.companyName ?? "",
            companyWebsite: profile?.website ?? "",
            companySize: profile?.companySize as CompanySize | null | undefined,
            industry: profile?.industry as Industry | null | undefined,
            fundingType: profile?.fundingType as FundingType | null | undefined,
            isFullyRemote: profile?.isFullyRemote ?? false,
            logoUrl: profile?.logo ?? null,
          },
        }}
      />
    </>
  );
}
