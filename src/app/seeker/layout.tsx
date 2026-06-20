import { auth } from "@/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { SeekerHeader } from "@/components/layout/SeekerHeader";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { UserRole } from "@/constants/enums";
import { fetchSeekerSettingsForPrefetch } from "@/lib/server/seeker-data.server";
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";

/*
 * SeekerLayout
 * Server component wrapping all /seeker/* routes.
 * Prefetches ["seeker-settings"] into the root QueryClient via HydrationBoundary
 * so child pages render with warm cache — no 0%-flash on first load.
 */
export default async function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  try {
    const session = await auth();
    if (session?.user?.id && session.user.role === UserRole.SEEKER) {
      await queryClient.prefetchQuery({
        queryKey: ["seeker-settings"],
        queryFn: () => fetchSeekerSettingsForPrefetch(session.user.id),
      });
    }
  } catch {
    // Prefetch failure is non-fatal — client useQuery handles it
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuthGuard
        requiredRole={UserRole.SEEKER}
        loginPath="/seeker/login"
        onboardingPath="/seeker/onboarding"
        fallbackDashboard="/seeker/dashboard"
      >
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
          <AuthRedirectToast />
          <SeekerHeader />
          <EmailVerificationBanner />
          <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </AuthGuard>
    </HydrationBoundary>
  );
}
