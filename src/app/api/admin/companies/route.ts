import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter } from "@/lib/rate-limit";

const adminReadLimiter = createRateLimiter("admin-companies-read", 60, "1 m");

/*
 * GET /api/admin/companies
 * Returns all recruiter profiles that have a Level 2 manual verification submission
 * pending (companyLinkedInUrl or companyWorkEmail set, companyVerified is false).
 * Also returns already-verified companies so admin can see the full picture.
 *
 * Ordered by updatedAt desc (most recently submitted first).
 * Returns 403 for non-admin sessions, 429 on rate limit.
 *
 * Response shape: { companies: CompanyVerificationItem[] }
 */
export async function GET() {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await adminReadLimiter.limit(session!.user!.id!);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Fetch profiles that have started Level 2 submission (have LinkedIn or workEmail)
  // plus already verified companies for audit visibility
  const profiles = await prisma.recruiterProfile.findMany({
    where: {
      OR: [
        { companyLinkedInUrl: { not: null } },
        { companyWorkEmail: { not: null } },
        { companyVerified: true },
      ],
    },
    select: {
      id: true,
      companyName: true,
      website: true,
      companyVerified: true,
      companyVerifiedAt: true,
      companyLinkedInUrl: true,
      companyWorkEmail: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ companies: profiles });
}
