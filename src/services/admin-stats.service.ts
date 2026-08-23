import { prisma } from "@/lib/prisma";
import {
  UserRole,
  PlanTier,
  VerificationStatus,
  PLAN_TIER_VALUES,
} from "@/constants/enums";
import { SubStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    days.push(new Date(today.getTime() - i * DAY_MS));
  }
  return days;
}

function dailyCounts<T extends { createdAt: Date }>(
  rows: T[],
  days: Date[],
): { date: string; count: number }[] {
  const buckets = days.map((d) => ({
    key: d.toISOString().slice(0, 10),
    date: d.toISOString().slice(0, 10),
    count: 0,
  }));
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  for (const b of buckets) {
    b.count = byDay.get(b.key) ?? 0;
  }
  return buckets.map(({ date, count }) => ({ date, count }));
}

export interface AdminSeekerRow {
  id: string;
  email: string | null;
  name: string | null;
  plan: PlanTier;
  createdAt: Date;
  lastActiveAt: Date | null;
  seekingStatus: string;
  verificationStatus: string;
  applicationCount: number;
}

export interface AdminJobRow {
  id: string;
  title: string;
  companyName: string | null;
  atsSource: string | null;
  location: string | null;
  locationClass: string | null;
  publishedAt: Date | null;
  lastSeenAt: Date | null;
  applicantCount: number;
  status: string;
}

export interface AdminJobsStats {
  totalActive: number;
  totalClosed: number;
  totalManual: number;
  newJobs7d: number;
  perSource: { source: string; count: number }[];
  jobs: AdminJobRow[];
  totalForTable: number;
  page: number;
  pageSize: number;
}

export interface AdminDashboardStats {
  newSeekers7d: number;
  totalSeekers: number;
  activeSeekers30d: number;
  signupTrend: { date: string; count: number }[];
  planSplit: { plan: PlanTier; count: number }[];
  activeSubscriptions: number;
  canceledSubscriptions: number;
  funnel: { total: number; onboarded: number; verified: number };
  generationTrend: { date: string; count: number }[];
  seekers: AdminSeekerRow[];
  totalSeekersForTable: number;
  page: number;
  pageSize: number;
}

export async function getAdminDashboardStats(
  page = 1,
  pageSize = 50,
  search?: string,
): Promise<AdminDashboardStats> {
  const now = new Date();
  const days14 = lastNDays(14);
  const whereSeeker: Prisma.UserWhereInput = {
    role: UserRole.SEEKER,
    ...(search?.trim()
      ? {
          OR: [
            { email: { contains: search.trim(), mode: "insensitive" as const } },
            { name: { contains: search.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [
    totalSeekers,
    newSeekers7d,
    activeSeekers30d,
    planSplit,
    activeSubscriptions,
    canceledSubscriptions,
    onboarded,
    verified,
    signupRows,
    resumeVersionRows,
    coverLetterRows,
    seekerRows,
    totalSeekersForTable,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.SEEKER } }),
    prisma.user.count({
      where: { role: UserRole.SEEKER, createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
    }),
    prisma.user.count({
      where: { role: UserRole.SEEKER, lastActiveAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      where: { role: UserRole.SEEKER },
      _count: { _all: true },
    }),
    prisma.subscription.count({ where: { status: SubStatus.ACTIVE } }),
    prisma.subscription.count({ where: { status: SubStatus.CANCELED } }),
    prisma.user.count({
      where: { role: UserRole.SEEKER, onboardingCompleted: true },
    }),
    prisma.user.count({
      where: { role: UserRole.SEEKER, verificationStatus: VerificationStatus.VERIFIED },
    }),
    prisma.user.findMany({
      where: { role: UserRole.SEEKER, createdAt: { gte: days14[0] } },
      select: { createdAt: true },
    }),
    prisma.resumeVersion.findMany({
      where: { createdAt: { gte: days14[0] } },
      select: { createdAt: true },
    }),
    prisma.coverLetter.findMany({
      where: { createdAt: { gte: days14[0] } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: whereSeeker,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        lastActiveAt: true,
        seekingStatus: true,
        verificationStatus: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where: whereSeeker }),
  ]);

  const emptyPlans = PLAN_TIER_VALUES.map((plan) => ({ plan, count: 0 }));
  const splitMap = new Map(planSplit.map((g) => [g.plan, g._count._all]));
  const planSplitResult = emptyPlans.map((p) => ({
    plan: p.plan,
    count: splitMap.get(p.plan) ?? 0,
  }));

  return {
    newSeekers7d,
    totalSeekers,
    activeSeekers30d,
    signupTrend: dailyCounts(signupRows, days14),
    planSplit: planSplitResult,
    activeSubscriptions,
    canceledSubscriptions,
    funnel: {
      total: totalSeekers,
      onboarded,
      verified,
    },
    generationTrend: dailyCounts(
      [...resumeVersionRows, ...coverLetterRows] as { createdAt: Date }[],
      days14,
    ),
    seekers: seekerRows.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      plan: s.plan as PlanTier,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      seekingStatus: s.seekingStatus,
      verificationStatus: s.verificationStatus,
      applicationCount: s._count.applications,
    })),
    totalSeekersForTable,
    page,
    pageSize,
  };
}

export async function getAdminJobsStats({
  page = 1,
  pageSize = 25,
  q,
  source,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  source?: string;
} = {}): Promise<AdminJobsStats> {
  const now = new Date();
  const whereActive: Prisma.JobWhereInput = { status: "OPEN" };
  const whereForTable: Prisma.JobWhereInput = {
    status: "OPEN",
    ...(source && source !== "All" ? { atsSource: source } : {}),
    ...(q?.trim()
      ? {
          OR: [
            { title: { contains: q.trim(), mode: "insensitive" as const } },
            { companyName: { contains: q.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [totalActive, totalClosed, totalManual, newJobs7d, perSourceRaw, jobs, totalForTable] = await Promise.all([
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.job.count({ where: { status: "CLOSED" } }),
    prisma.job.count({ where: { status: "DRAFT", isManual: true } }),
    prisma.job.count({ where: { status: "OPEN", createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } } }),
    prisma.job.groupBy({
      by: ["atsSource"],
      where: { status: "OPEN" },
      _count: { _all: true },
    }),
    prisma.job.findMany({
      where: whereForTable,
      select: {
        id: true,
        title: true,
        companyName: true,
        atsSource: true,
        location: true,
        locationClass: true,
        publishedAt: true,
        lastSeenAt: true,
        status: true,
        _count: { select: { applications: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where: whereForTable }),
  ]);

  const perSource = perSourceRaw.map((g) => ({ source: g.atsSource ?? "—", count: g._count._all }));

  return {
    totalActive,
    totalClosed,
    totalManual,
    newJobs7d,
    perSource,
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      companyName: j.companyName,
      atsSource: j.atsSource,
      location: j.location,
      locationClass: j.locationClass,
      publishedAt: j.publishedAt,
      lastSeenAt: j.lastSeenAt,
      applicantCount: j._count.applications,
      status: j.status,
    })),
    totalForTable,
    page,
    pageSize,
  };
}