import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { OnboardingContainer } from "@/modules/onboarding";

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
    select: { onboardingCompleted: true },
  });
  if (user?.onboardingCompleted === true) {
    redirect("/recruiter/dashboard");
  }

  return (
    <>
      <EmailVerificationBanner />
      <OnboardingContainer />
    </>
  );
}
