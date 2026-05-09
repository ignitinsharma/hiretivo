import React from "react";
import { auth } from "@/auth";
import { RecommendedJobsList } from "@/modules/seeker/dashboard/components/RecommendedJobsList";
import { SeekerDashboardSidebar } from "@/modules/seeker/dashboard/components/SeekerDashboardSidebar";
import { UpcomingInterviewsCard } from "@/modules/seeker/dashboard/components/UpcomingInterviewsCard";

export default async function SeekerDashboardPage() {
  const session = await auth();
  const greetingName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {greetingName}!
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Your personalized job market is ready.
        </p>
      </div>

      <UpcomingInterviewsCard />

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <RecommendedJobsList />
        <SeekerDashboardSidebar />
      </div>
    </>
  );
}
