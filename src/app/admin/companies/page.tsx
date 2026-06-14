import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  UserRole,
  JobStatus,
  SubscriptionStatus,
  PlanTier,
  PLAN_TIER_VALUES,
} from "@/constants/enums";
import { AdminCompaniesTable } from "@/modules/admin/components/AdminCompaniesTable";
import { AdminBadge } from "@/modules/admin/components/AdminBadge";
import { PLAN_TIER_DISPLAY } from "@/modules/admin/utils/status-display";

interface AdminCompaniesPageProps {
  searchParams?: { page?: string };
}

/*
 * /admin/companies
 * Server component companies oversight page. Lists RECRUITER users (companies)
 * joined to their RecruiterProfile with a plan-breakdown summary header and
 * server-side offset pagination. Layout (src/app/admin/layout.tsx) enforces
 * admin auth — this page queries Prisma directly without re-checking.
 *
 * @param searchParams - URL query; `page` is NaN-guarded (Pitfall 5) before feeding skip.
 * @returns Plan-breakdown header + paginated AdminCompaniesTable + Prev/Next controls.
 */
export default async function AdminCompaniesPage({
  searchParams,
}: AdminCompaniesPageProps) {
  const rawPage = searchParams?.page;
  const parsed = parseInt(rawPage ?? "1", 10);
  const page = Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  const PAGE_SIZE = 25;

  const [users, total, grouped] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.RECRUITER },
      select: {
        id: true,
        email: true,
        plan: true,
        createdAt: true,
        recruiterProfile: { select: { companyName: true } },
        subscription: { select: { status: true } },
        _count: { select: { jobsPosted: { where: { status: JobStatus.OPEN } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: { role: UserRole.RECRUITER } }),
    prisma.user.groupBy({
      by: ["plan"],
      where: { role: UserRole.RECRUITER },
      _count: { _all: true },
    }),
  ]);

  // groupBy is sparse — initialize every tier to 0, then merge actual counts.
  const planCounts: Record<PlanTier, number> = {
    [PlanTier.FREE]: 0,
    [PlanTier.STARTER]: 0,
    [PlanTier.GROWTH]: 0,
    [PlanTier.SCALE]: 0,
  };
  for (const row of grouped) {
    planCounts[row.plan as PlanTier] = row._count._all;
  }

  const companies = users.map((u) => ({
    id: u.id,
    companyName: u.recruiterProfile?.companyName ?? "—",
    email: u.email ?? "—",
    plan: u.plan as PlanTier,
    signupDate: u.createdAt.toISOString(),
    openJobs: u._count.jobsPosted,
    isActive:
      u._count.jobsPosted > 0 ||
      u.subscription?.status === SubscriptionStatus.ACTIVE,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page * PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight text-brand-foreground">
          Companies
        </h1>
        <p className="mt-1 text-sm text-brand-foreground-muted">
          {total} {total === 1 ? "company" : "companies"} on the platform
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLAN_TIER_VALUES.map((tier) => {
          const display = PLAN_TIER_DISPLAY[tier];
          return (
            <div
              key={tier}
              className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2"
            >
              <AdminBadge label={display.label} className={display.badge} />
              <span className="font-semibold text-sm text-brand-foreground">
                {planCounts[tier]}
              </span>
            </div>
          );
        })}
      </div>

      <AdminCompaniesTable companies={companies} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-foreground-muted">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          {hasPrev ? (
            <Link
              href={`/admin/companies?page=${page - 1}`}
              className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-surface"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-brand-foreground-secondary">
              Previous
            </span>
          )}
          {hasNext ? (
            <Link
              href={`/admin/companies?page=${page + 1}`}
              className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-surface"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-brand-foreground-secondary">
              Next
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
