import { prisma } from "@/lib/prisma";
import {
  UserRole,
  JobStatus,
  PlanTier,
  VerificationStatus,
} from "@/constants/enums";

/*
 * OverviewStats
 * Shape of the admin dashboard aggregate stats. Single home for this contract —
 * the page, the stats API, and AdminOverviewStats all import it from here.
 */
export interface OverviewStats {
  candidatesByStatus: Record<VerificationStatus, number>;
  companiesByPlan: Record<PlanTier, number>;
  totalSeekers: number;
  totalCompanies: number;
  openJobs: number;
  totalJobs: number;
  signups7: { seekers: number; companies: number };
  signups30: { seekers: number; companies: number };
}

/*
 * getOverviewStats
 * Single source of aggregate truth for the admin overview. Computes candidate
 * verification-status counts, company plan split, recent-signup counts (7/30d),
 * and platform totals using count/groupBy aggregates only — never row loads (D-10).
 * Queries run sequentially (Neon-safe; no $transaction parallelism — RESEARCH A3).
 *
 * @returns OverviewStats with every VerificationStatus and PlanTier bucket present (0-filled).
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const verifGrouped = await prisma.user.groupBy({
    by: ["verificationStatus"],
    where: { role: UserRole.SEEKER },
    _count: { _all: true },
  });
  const planGrouped = await prisma.user.groupBy({
    by: ["plan"],
    where: { role: UserRole.RECRUITER },
    _count: { _all: true },
  });

  const totalSeekers = await prisma.user.count({ where: { role: UserRole.SEEKER } });
  const totalCompanies = await prisma.user.count({
    where: { role: UserRole.RECRUITER },
  });
  const openJobs = await prisma.job.count({ where: { status: JobStatus.OPEN } });
  const totalJobs = await prisma.job.count();

  const seekers7 = await prisma.user.count({
    where: { role: UserRole.SEEKER, createdAt: { gte: day7 } },
  });
  const companies7 = await prisma.user.count({
    where: { role: UserRole.RECRUITER, createdAt: { gte: day7 } },
  });
  const seekers30 = await prisma.user.count({
    where: { role: UserRole.SEEKER, createdAt: { gte: day30 } },
  });
  const companies30 = await prisma.user.count({
    where: { role: UserRole.RECRUITER, createdAt: { gte: day30 } },
  });

  // groupBy is sparse — initialize every bucket to 0, then merge actual counts.
  const candidatesByStatus: Record<VerificationStatus, number> = {
    [VerificationStatus.NOT_SUBMITTED]: 0,
    [VerificationStatus.PENDING]: 0,
    [VerificationStatus.IN_REVIEW]: 0,
    [VerificationStatus.VERIFIED]: 0,
    [VerificationStatus.REJECTED]: 0,
  };
  for (const r of verifGrouped) {
    candidatesByStatus[r.verificationStatus as VerificationStatus] = r._count._all;
  }

  const companiesByPlan: Record<PlanTier, number> = {
    [PlanTier.FREE]: 0,
    [PlanTier.STARTER]: 0,
    [PlanTier.GROWTH]: 0,
    [PlanTier.SCALE]: 0,
  };
  for (const r of planGrouped) {
    companiesByPlan[r.plan as PlanTier] = r._count._all;
  }

  return {
    candidatesByStatus,
    companiesByPlan,
    totalSeekers,
    totalCompanies,
    openJobs,
    totalJobs,
    signups7: { seekers: seekers7, companies: companies7 },
    signups30: { seekers: seekers30, companies: companies30 },
  };
}
