"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { RecruiterHeader } from "@/components/layout/RecruiterHeader";
import { RecruiterSidebarProvider } from "@/components/layout/RecruiterSidebar";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { PaidFeatureModal } from "@/components/shared/PaidFeatureModal";
import { PostJobModal } from "@/modules/recruiter/jobs/components/PostJobModal";
import { ReactQueryProvider } from "@/providers/query-provider";

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
    <div className="min-h-screen bg-brand-surface">
      {/* Recruiter-scoped QueryClient — isolates recruiter cache from the root client,
          so recruiter prefetches hydrate into this client, not the shared one. */}
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
    </div>
  );
}
