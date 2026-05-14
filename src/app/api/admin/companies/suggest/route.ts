import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter } from "@/lib/rate-limit";

const adminReadLimiter = createRateLimiter("admin-read", 60, "1 m");

/*
 * GET /api/admin/companies/suggest?q=str
 * Returns distinct previously-used company entries for autocomplete during admin job creation.
 * Filters by case-insensitive companyName match against existing admin-posted jobs.
 * Returns up to 10 results ordered by most recently created.
 * Returns 403 for non-admin, 429 on rate limit, empty array when q is blank.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await adminReadLimiter.limit(session!.user!.id!);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ companies: [] });
  }

  const rows = await prisma.job.findMany({
    where: {
      isAdminPosted: true,
      companyName: { contains: q, mode: "insensitive", not: null },
    },
    select: {
      companyName: true,
      companyLogoUrl: true,
      companyWebsite: true,
      companySize: true,
      companyIndustry: true,
      companyFunding: true,
    },
    distinct: ["companyName"],
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ companies: rows });
}
