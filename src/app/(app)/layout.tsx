import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserRole } from "@/constants/enums";
import { AppShellClient } from "./AppShellClient";

/*
 * AppLayout
 * Server layout for the pivot seeker surface (route group `(app)`).
 * Gates the whole subtree to onboarded SEEKER users via AuthGuard, then
 * hands off to the client shell (query provider + sidebar).
 * Login/onboarding paths reuse the existing /seeker/* auth routes; wrong-role
 * or unauthenticated visitors are redirected by AuthGuard.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      requiredRole={UserRole.SEEKER}
      loginPath="/seeker/login"
      onboardingPath="/seeker/onboarding"
      fallbackDashboard="/dashboard"
    >
      <AppShellClient>{children}</AppShellClient>
    </AuthGuard>
  );
}
