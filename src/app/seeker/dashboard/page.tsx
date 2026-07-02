import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecommendedJobsList } from "@/modules/seeker/dashboard/components/RecommendedJobsList";
import { SeekerDashboardSidebar } from "@/modules/seeker/dashboard/components/SeekerDashboardSidebar";
import { UpcomingInterviewsCard } from "@/modules/seeker/dashboard/components/UpcomingInterviewsCard";
import { RejectionCallout } from "@/modules/seeker/dashboard/components/RejectionCallout";
import { CreditsBanner } from "@/modules/seeker/dashboard/components/CreditsBanner";
import { TopMatchesRow } from "@/modules/seeker/dashboard/components/TopMatchesRow";

/*
 * SeekerDashboardPage
 * Main seeker dashboard — server component.
 * Fetches verification status server-side so the RejectionCallout renders on first paint
 * without a client-side round trip.
 */
export default async function SeekerDashboardPage() {
  const session = await auth();
  const greetingName = session?.user?.name?.split(" ")[0] ?? "there";

  const userRecord = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          verificationStatus: true,
          seekerProfile: { select: { verificationNotes: true } },
        },
      })
    : null;

  const verificationStatus = userRecord?.verificationStatus ?? 'NOT_SUBMITTED';
  const verificationNotes = userRecord?.seekerProfile?.verificationNotes ?? null;

  return (
    <>
      <RejectionCallout status={verificationStatus} verificationNotes={verificationNotes} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-foreground tracking-tight">
          Welcome back, {greetingName}!
        </h1>
        <p className="text-brand-foreground-muted mt-2 text-lg">
          Your personalized job market is ready.
        </p>
      </div>

      <CreditsBanner />

      <UpcomingInterviewsCard />

      <TopMatchesRow />

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <RecommendedJobsList />
        <SeekerDashboardSidebar />
      </div>
    </>
  );
}
