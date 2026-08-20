import { auth } from "@/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { AppHeader } from "@/components/layout/AppHeader";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { PaidFeatureModal } from "@/components/shared/PaidFeatureModal";
import { UserRole } from "@/constants/enums";
import { fetchSeekerSettingsForPrefetch } from "@/lib/server/seeker-data.server";
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function AppLayout({
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
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuthGuard
        requiredRole={UserRole.SEEKER}
        loginPath="/seeker/login"
        onboardingPath="/seeker/onboarding"
        fallbackDashboard="/dashboard"
      >
        <div className="min-h-screen bg-brand-surface text-brand-foreground flex flex-col">
          <AuthRedirectToast />
          <AppHeader />
          <EmailVerificationBanner />
          <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
          <PaidFeatureModal />
        </div>
      </AuthGuard>
    </HydrationBoundary>
  );
}
