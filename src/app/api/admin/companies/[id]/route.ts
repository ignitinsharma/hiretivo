import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter } from "@/lib/rate-limit";
import { AdminReviewSchema } from "@/lib/validations/company-verification.schema";

const adminWriteLimiter = createRateLimiter("admin-companies-write", 30, "1 m");

/*
 * PATCH /api/admin/companies/[id]
 * Admin approves or rejects a Level 2 company verification submission.
 *
 * Request body: { action: "approve" | "reject" }
 *
 * approve: sets companyVerified=true, companyVerifiedAt=now()
 * reject:  clears companyLinkedInUrl and companyWorkEmail (requester can re-submit),
 *          leaves companyVerified=false
 *
 * [id] is the RecruiterProfile.id (not userId).
 *
 * Returns 403 for non-admin sessions, 400 on validation failure, 404 when
 * profile not found, 429 on rate limit.
 * Returns { success: true, companyVerified: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await adminWriteLimiter.limit(session!.user!.id!);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AdminReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action } = parsed.data;
  const profileId = params.id;

  // Verify profile exists before mutating
  const profile = await prisma.recruiterProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.recruiterProfile.update({
      where: { id: profileId },
      data: {
        companyVerified: true,
        companyVerifiedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, companyVerified: true });
  }

  // action === "reject": clear the submission so recruiter can re-submit
  await prisma.recruiterProfile.update({
    where: { id: profileId },
    data: {
      companyLinkedInUrl: null,
      companyWorkEmail: null,
    },
  });
  return NextResponse.json({ success: true, companyVerified: false });
}
