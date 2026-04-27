"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActiveJobsList } from "@/modules/recruiter/dashboard/components/ActiveJobsList";
import { RecentApplicantsList } from "@/modules/recruiter/dashboard/components/RecentApplicantsList";
import { ApplicationTrendChart } from "@/modules/recruiter/dashboard/components/ApplicationTrendChart";
import { useFetchRecruiterDashboard } from "@/modules/recruiter/dashboard/queries/use-fetch-recruiter-dashboard";
import { cn } from "@/lib/utils";
import { Briefcase, FileText, Calendar, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatItem {
  label: string;
  value: string | number;
  trend?: string;
  variant?: "default" | "primary";
  icon: React.ReactNode;
}

function Sparkline({ isPrimary }: { isPrimary: boolean }) {
  const strokeColor = isPrimary ? "rgba(255,255,255,0.6)" : "currentColor";
  return (
    <svg className="w-20 h-8" viewBox="0 0 80 32" fill="none">
      <path
        d="M2 24 C8 24, 12 16, 20 18 C28 20, 32 26, 40 22 C48 18, 52 10, 60 12 C68 14, 72 8, 78 6"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({ stat }: { stat: DashboardStatItem }) {
  const isPrimary = stat.variant === "primary";
  return (
    <div
      className={cn(
        "p-6 rounded-xl flex flex-col justify-between",
        isPrimary
          ? "bg-linear-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
          : "bg-white border border-slate-200 shadow-sm",
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            isPrimary ? "bg-white/20" : "bg-primary/10",
          )}
        >
          <span className={cn(isPrimary ? "text-white" : "text-primary")}>
            {stat.icon}
          </span>
        </div>
        <p
          className={cn(
            "text-sm font-medium",
            isPrimary ? "opacity-80" : "text-slate-600",
          )}
        >
          {stat.label}
        </p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{stat.value}</span>
            {stat.trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                  isPrimary
                    ? "bg-white/20 text-white"
                    : "text-emerald-600 bg-emerald-50",
                )}
              >
                {stat.trend}
              </span>
            )}
          </div>
          <p
            className={cn(
              "text-xs mt-1",
              isPrimary ? "opacity-70" : "text-slate-400",
            )}
          >
            vs last week
          </p>
        </div>
        <Sparkline isPrimary={isPrimary} />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function RecruiterDashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useFetchRecruiterDashboard();

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const stats: DashboardStatItem[] = [
    {
      label: "Active Jobs",
      value: data?.activeJobsCount ?? 0,
      trend: "+5%",
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      label: "Total Applications",
      value: data?.totalApplications ?? 0,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: "New This Week",
      value: data?.newThisWeek ?? 0,
      variant: "primary",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Avg. Match Score",
      value: data ? `${data.avgMatchScore}%` : "—",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full p-8 space-y-8">
      <PageHeader
        title={`${getGreeting()}, ${firstName}.`}
        subtitle="Here's what's happening with your recruitment pipeline today."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 flex">
          <ActiveJobsList />
        </div>
        <div className="lg:col-span-2 flex">
          <RecentApplicantsList
            applicants={data?.recentApplicants ?? []}
            isLoading={isLoading}
          />
        </div>
      </section>

      <ApplicationTrendChart />
    </div>
  );
}
