import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { UserRole, JobStatus, SubscriptionStatus, PlanTier } from "@/constants/enums";

const adminCompaniesReadLimiter = createRateLimiter("admin-companies-read", 30, "1 m");

/*
 * GET /api/admin/companies
 * Paginated, rate-limited, admin-gated companies (RECRUITER users) list for
 * client-side interactive use. The /admin/companies page itself uses direct
 * Prisma; this endpoint mirrors that bounded query.
 *
 * Flow: auth() → isAdminSession 403 → rate-limit 429 → NaN-guarded page → bounded query.
 *
 * @param req - Untrusted request; `?page=` is validated before feeding skip.
 * @returns 403 (non-admin), 429 (rate limited), or { data: { companies, total, page, pageSize } }.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await adminCompaniesReadLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawPage = req.nextUrl.searchParams.get("page") ?? undefined;
  const parsed = parseInt(rawPage ?? "1", 10);
  const page = Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  const PAGE_SIZE = 25;

  const [users, total] = await Promise.all([
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
  ]);

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

  return NextResponse.json({
    data: { companies, total, page, pageSize: PAGE_SIZE },
  });
}
