import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionUserState, UserRole } from "@/constants/enums";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  loginPath: string;
  onboardingPath: string;
  fallbackDashboard: string;
}

/*
 * AuthGuard
 * Server-side gate for role-scoped areas (/seeker/*, /recruiter/*). Runs the
 * authoritative DB-backed checks that middleware (JWT-only, edge) cannot.
 * @param requiredRole      - role this subtree demands
 * @param loginPath         - where to send an unauthenticated visitor
 * @param onboardingPath    - where to send an authenticated-but-unboarded user
 * @param fallbackDashboard - where to bounce a wrong-role user
 * @returns children when the session maps to a real, onboarded, correctly-roled user
 * Side effects: redirects (throws) on every non-OK branch.
 *
 * Loop safety: a JWT can outlive its DB user (data reset, deletion). Such a
 * session is INVALID, not unboarded — routing it to onboarding makes middleware
 * (which trusts the JWT's onboarded flag) bounce it straight back here forever.
 * So a MISSING user exits to the public /auth/session-expired page, which clears
 * the stale cookie client-side instead of re-entering a guarded route.
 */
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

  const state = await resolveUserState(session.user.id);

  // Stale JWT, DB user gone → terminate the session cleanly (do NOT loop via onboarding).
  if (state === SessionUserState.MISSING) {
    redirect(`/auth/session-expired?role=seeker`);
  }

  // Real user, onboarding incomplete → onboarding flow.
  if (process.env.NEXT_PUBLIC_SELF_HOSTED !== "true" && state === SessionUserState.NOT_ONBOARDED) {
    redirect(onboardingPath);
  }

  return <>{children}</>;
}

/*
 * resolveUserState
 * Maps a JWT user id to the authoritative DB-backed session state.
 * @param userId - session.user.id taken from the JWT
 * @returns MISSING (no DB row), NOT_ONBOARDED (row exists, flag false), or OK
 */
async function resolveUserState(userId: string): Promise<SessionUserState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });

  if (!user) {
    return SessionUserState.MISSING;
  }

  return user.onboardingCompleted === true
    ? SessionUserState.OK
    : SessionUserState.NOT_ONBOARDED;
}
