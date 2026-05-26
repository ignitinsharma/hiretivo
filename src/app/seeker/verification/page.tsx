import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { normalizeCodingProfiles } from "@/lib/verification/coding-profiles";
import { getVerificationReadiness } from "@/lib/verification/readiness";
import { VerificationFlow } from "@/modules/verification/components/VerificationFlow";

export default async function VerificationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/seeker/login?callbackUrl=/seeker/verification");
  }

  if (session.user.role !== UserRole.SEEKER) {
    redirect("/seeker/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      timezone: true,
      verificationStatus: true,
      reapplyAfter: true,
      seekerProfile: {
        select: {
          githubUsername: true,
          githubUrl: true,
          codingProfiles: true,
          videoIntroUrl: true,
          bio: true,
          primaryRole: true,
          yearsExperience: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          topProjects: true,
          skills: { select: { id: true } },
          workExperiences: { select: { id: true } },
        },
      },
    },
  });

  const initialStatus =
    (user?.verificationStatus as VerificationStatus | undefined) ??
    VerificationStatus.NOT_SUBMITTED;

  if (
    initialStatus === VerificationStatus.PENDING ||
    initialStatus === VerificationStatus.IN_REVIEW ||
    initialStatus === VerificationStatus.VERIFIED
  ) {
    redirect("/seeker/dashboard");
  }

  const readiness = getVerificationReadiness(user ?? {});
  const prefillGithubUrl =
    user?.seekerProfile?.githubUrl ??
    (user?.seekerProfile?.githubUsername
      ? `https://github.com/${user.seekerProfile.githubUsername}`
      : null);

  return (
    <main className="min-h-screen bg-brand-surface">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <VerificationFlow
          initialStatus={initialStatus}
          prefillGithubUrl={prefillGithubUrl}
          prefillCodingProfiles={normalizeCodingProfiles(
            user?.seekerProfile?.codingProfiles,
          )}
          prefillVideoIntroUrl={user?.seekerProfile?.videoIntroUrl ?? null}
          readiness={readiness}
          reapplyAfter={user?.reapplyAfter?.toISOString() ?? null}
        />
      </div>
    </main>
  );
}
