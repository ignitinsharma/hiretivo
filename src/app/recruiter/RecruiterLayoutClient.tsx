"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { RecruiterHeader } from "@/components/layout/RecruiterHeader";
import { RecruiterSidebarProvider } from "@/components/layout/RecruiterSidebar";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { PaidFeatureModal } from "@/components/shared/PaidFeatureModal";
import { PostJobModal } from "@/modules/recruiter/jobs/components/PostJobModal";
import { ReactQueryProvider } from "@/providers/query-provider";
import { UserRole } from "@/constants/enums";

interface RecruiterLayoutClientProps {
  children: React.ReactNode;
  dehydratedState: DehydratedState;
}

/*
 * RecruiterLayoutClient
 * Client shell for all /recruiter/* routes.
 * Receives server-prefetched dehydratedState and hydrates the recruiter-scoped
 * QueryClient so child pages have warm cache on first render.
 */
export function RecruiterLayoutClient({
  children,
  dehydratedState,
}: RecruiterLayoutClientProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthGuard
        requiredRole={UserRole.RECRUITER}
        loginPath="/recruiter/login"
        onboardingPath="/recruiter/onboarding"
        fallbackDashboard="/recruiter/dashboard"
      >
        <ReactQueryProvider>
          <HydrationBoundary state={dehydratedState}>
            <RecruiterSidebarProvider>
              <AuthRedirectToast />
              <EmailVerificationBanner />
              <RecruiterHeader />
              {children}
              <PostJobModal />
              <PaidFeatureModal />
            </RecruiterSidebarProvider>
          </HydrationBoundary>
        </ReactQueryProvider>
      </AuthGuard>
    </div>
  );
}
