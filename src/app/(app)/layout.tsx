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
 *
 * fallbackDashboard is /seeker/login, not /dashboard: this layout IS
 * /dashboard, so a self-referential fallback would redirect a wrong-role
 * (or stale-JWT) session back into the same AuthGuard check forever. The
 * recruiter surface is also unreachable during this pivot (middleware
 * bounces /recruiter/* back to /dashboard), so there is no other in-app
 * destination for a non-SEEKER session — send it out to login instead.
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
      fallbackDashboard="/seeker/login"
    >
      <AppShellClient>{children}</AppShellClient>
    </AuthGuard>
  );
}
