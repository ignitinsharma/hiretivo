import React from "react";
import { auth } from "@/auth";
import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { RecommendedJobsList } from "@/modules/seeker/dashboard/components/RecommendedJobsList";
import { SeekerDashboardSidebar } from "@/modules/seeker/dashboard/components/SeekerDashboardSidebar";
import { UpcomingInterviewsCard } from "@/modules/seeker/dashboard/components/UpcomingInterviewsCard";
import { VerificationStatusCard } from "@/modules/seeker-dashboard/components/VerificationStatusCard";

export default async function SeekerDashboardPage() {
  const session = await auth();
  const greetingName = session?.user?.name?.split(" ")[0] ?? "there";
  const verification = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          verificationStatus: true,
          hiretivoScore: true,
          reapplyAfter: true,
          verificationReviews: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              scoreGiven: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      })
    : null;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-foreground tracking-tight">
          Welcome back, {greetingName}!
        </h1>
        <p className="text-brand-foreground-muted mt-2 text-lg">
          Your personalized job market is ready.
        </p>
      </div>

      <UpcomingInterviewsCard />

      <div className="mt-8">
        <VerificationStatusCard
          verificationStatus={
            (verification?.verificationStatus as VerificationStatus | undefined) ??
            VerificationStatus.NOT_SUBMITTED
          }
          hiretivoScore={verification?.hiretivoScore ?? null}
          reapplyAfter={verification?.reapplyAfter ?? null}
          lastReview={verification?.verificationReviews[0] ?? null}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <RecommendedJobsList />
        <SeekerDashboardSidebar />
      </div>
    </>
  );
}
