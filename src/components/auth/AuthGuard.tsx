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

  // Check explicit onboarding completion flag.
  const isOnboarded = await checkOnboarding(session.user.id);

  if (!isOnboarded) {
    redirect(onboardingPath);
  }

  return <>{children}</>;
}

async function checkOnboarding(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });

  return user?.onboardingCompleted === true;
}
