import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { RecruiterHeader } from "@/components/layout/RecruiterHeader";
import { RecruiterSidebarProvider } from "@/components/layout/RecruiterSidebar";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { PaidFeatureModal } from "@/components/shared/PaidFeatureModal";
import { PostJobModal } from "@/modules/recruiter/jobs/components/PostJobModal";
import { ReactQueryProvider } from "@/providers/query-provider";
import { UserRole } from "@/constants/enums";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthGuard
        requiredRole={UserRole.RECRUITER}
        loginPath="/recruiter/login"
        onboardingPath="/recruiter/onboarding"
        fallbackDashboard="/recruiter/dashboard"
      >
        <ReactQueryProvider>
          <RecruiterSidebarProvider>
            <AuthRedirectToast />
            <EmailVerificationBanner />
            <RecruiterHeader />
            {children}
            <PostJobModal />
            <PaidFeatureModal />
          </RecruiterSidebarProvider>
        </ReactQueryProvider>
      </AuthGuard>
    </div>
  );
}
