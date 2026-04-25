import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  loginPath: string;
  onboardingPath: string;
  fallbackDashboard: string;
}

export async function AuthGuard({
  children,
  requiredRole,
  loginPath,
  onboardingPath,
  fallbackDashboard,
}: AuthGuardProps) {
  const session = await auth();

  // No session → redirect to login
  if (!session?.user) {
    redirect(loginPath);
  }

  // Wrong role → redirect to their dashboard with error
  if (session.user.role !== requiredRole) {
    redirect(`${fallbackDashboard}?authError=forbidden`);
  }

  // Check onboarding completeness
  const isOnboarded = await checkOnboarding(session.user.id, requiredRole);

  if (!isOnboarded) {
    redirect(onboardingPath);
  }

  return <>{children}</>;
}

async function checkOnboarding(
  userId: string,
  role: UserRole
): Promise<boolean> {
  if (role === UserRole.SEEKER) {
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId },
      select: { situation: true, primaryRole: true },
    });
    return seekerProfile?.situation != null && seekerProfile?.primaryRole != null;
  }

  // RECRUITER
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return recruiterProfile != null;
}
