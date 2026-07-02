import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { PROGRESSIVE_ONBOARDING } from "@/constants/flags";
import { parseLegacyLocation } from "@/modules/india-location";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { SeekerOnboardingContainer, ProgressiveOnboardingContainer } from "@/modules/seeker-onboarding";
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
          location: true,
          primaryRole: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          workPreference: true,
          resumeKey: true,
          headline: true,
          bio: true,
          githubUrl: true,
          linkedinUrl: true,
          twitterUrl: true,
          websiteUrl: true,
          videoIntroUrl: true,
          topProjects: true,
          skills: { select: { skill: { select: { name: true } } } },
          workExperiences: {
            select: {
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          educations: {
            select: {
              institution: true,
              graduationDate: true,
              degree: true,
              major: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (PROGRESSIVE_ONBOARDING) {
    // No review wall in the pivot — onboardingCompleted alone means "done, go browse".
    if (user?.onboardingCompleted === true) {
      redirect("/seeker/dashboard");
    }
    return (
      <>
        <EmailVerificationBanner />
        <ProgressiveOnboardingContainer userName={user?.name?.split(" ")[0] ?? "there"} />
      </>
    );
  }

  // Redirect only when review is pending/approved — REJECTED seekers must be able to resubmit
  if (
    user?.onboardingCompleted === true &&
    user?.verificationStatus !== "NOT_SUBMITTED" &&
    user?.verificationStatus !== "REJECTED"
  ) {
    redirect("/seeker/dashboard");
  }

  const profile = user?.seekerProfile;
  const draft = parseOnboardingDraft(user?.onboardingDraft);

  // Safely cast topProjects JSON → typed project entries
  const rawProjects = profile?.topProjects as unknown as Array<Record<string, unknown>> | null;
  const projects = Array.isArray(rawProjects)
    ? rawProjects
        .filter(
          (p) =>
            typeof p?.title === 'string' &&
            typeof p?.url === 'string' &&
            typeof p?.description === 'string',
        )
        .map((p) => ({
          title: p.title as string,
          url: p.url as string,
          description: p.description as string,
        }))
    : [];

  const hasProjects = projects.length > 0;

  const initialStep: SeekerOnboardingStep = resolveSeekerOnboardingStep(
    user?.onboardingStep,
    profile
      ? {
          situation: profile.situation,
          location: profile.location,
          primaryRole: profile.primaryRole,
          availability: profile.availability,
          skillsCount: profile.skills.length,
          githubUrl: profile.githubUrl,
          hasProjects,
          workExperiencesCount: profile.workExperiences.length,
          educationsCount: profile.educations.length,
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
            ...parseLegacyLocation(profile?.location),
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
          proofOfWork: {
            githubUrl: profile?.githubUrl ?? "",
            linkedinUrl: profile?.linkedinUrl ?? null,
            twitterUrl: profile?.twitterUrl ?? null,
            websiteUrl: profile?.websiteUrl ?? null,
            videoIntroUrl: profile?.videoIntroUrl ?? null,
            projects,
          },
          experience: {
            workExperiences: profile?.workExperiences ?? [],
            educations: profile?.educations ?? [],
          },
          compensation: {
            headline: profile?.headline ?? "",
            bio: profile?.bio ?? "",
            salaryMin: profile?.salaryMin ?? null,
            salaryMax: profile?.salaryMax ?? null,
            availability: profile?.availability ?? null,
            workPreference: profile?.workPreference ?? null,
            resume: profile?.resumeKey
              ? {
                  name: profile.resumeKey.split("/").pop() ?? "resume.pdf",
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
