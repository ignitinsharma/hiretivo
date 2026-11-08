import { auth } from "@/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { AppShell } from "@/components/layout/AppShell";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { AddCustomJobModal } from "@/components/shared/AddCustomJobModal";
import { PaidFeatureModal } from "@/components/shared/PaidFeatureModal";
import { UserRole } from "@/constants/enums";
import { fetchSeekerSettingsForPrefetch } from "@/lib/server/seeker-data.server";
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();
  const defaultSidebarOpen = cookies().get("sidebar_state")?.value !== "false";

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
        <AppShell defaultSidebarOpen={defaultSidebarOpen}>
          <AuthRedirectToast />
          <EmailVerificationBanner />
          {children}
          <AddCustomJobModal />
          <PaidFeatureModal />
        </AppShell>
      </AuthGuard>
    </HydrationBoundary>
  );
}
