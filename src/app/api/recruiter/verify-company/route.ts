import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  isFreemailDomain,
  checkLevel1Match,
} from "@/lib/company-verification";
import { Level2SubmitSchema } from "@/lib/validations/company-verification.schema";
import { sendCompanyVerificationAdminEmail } from "@/lib/email/company-verification";

const verifyCompanyLimiter = createRateLimiter("verify-company", 5, "1 m");

/*
 * POST /api/recruiter/verify-company
 * Company verification entry point for recruiters.
 *
 * Level 1 (auto): if the recruiter's email domain matches their company website domain,
 * sets companyVerified=true and companyVerifiedAt=now() immediately and returns
 * { level: 1, verified: true }.
 *
 * Level 2 (manual): if the recruiter uses a freemail domain (Gmail/Yahoo/etc.) or the
 * domain doesn't match, expects { companyLinkedInUrl, companyWorkEmail } in body and
 * queues the submission for admin review. Stores both fields, notifies admin via email,
 * returns { level: 2, pending: true }.
 *
 * Rate limit: 5 req/min per user (write operation).
 * Returns 401 when unauthenticated, 403 when not RECRUITER role, 404 when profile
 * not found, 400 on validation failure, 429 on rate limit.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await verifyCompanyLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Load recruiter profile — need website and current verification state
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      recruiterProfile: {
        select: {
          id: true,
          companyName: true,
          website: true,
          companyVerified: true,
        },
      },
    },
  });

  if (!user?.recruiterProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { recruiterProfile } = user;
  const email = user.email ?? "";
  const websiteUrl = recruiterProfile.website ?? "";

  // Already verified — idempotent early return
  if (recruiterProfile.companyVerified) {
    return NextResponse.json({ level: 1, verified: true, alreadyVerified: true });
  }

  // --- Level 1: domain match check ---
  // Only applicable when the company has a website and the recruiter email is not freemail
  const isFreemail = isFreemailDomain(email);

  if (!isFreemail && websiteUrl && checkLevel1Match(email, websiteUrl)) {
    // Auto-verify: email domain matches company website domain
    await prisma.recruiterProfile.update({
      where: { id: recruiterProfile.id },
      data: {
        companyVerified: true,
        companyVerifiedAt: new Date(),
      },
    });
    return NextResponse.json({ level: 1, verified: true });
  }

  // --- Level 2: parse body and queue for admin review ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body — provide companyLinkedInUrl and companyWorkEmail for manual verification" },
      { status: 400 }
    );
  }

  const parsed = Level2SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { companyLinkedInUrl, companyWorkEmail } = parsed.data;

  // Store Level 2 submission — not verified yet, pending admin review
  await prisma.recruiterProfile.update({
    where: { id: recruiterProfile.id },
    data: {
      companyLinkedInUrl,
      companyWorkEmail,
      // companyVerified remains false until admin approves
    },
  });

  // Notify admin asynchronously — no-op if ADMIN_EMAIL is unset
  await sendCompanyVerificationAdminEmail({
    recruiterName: user.name,
    companyName: recruiterProfile.companyName,
    companyLinkedInUrl,
    companyWorkEmail,
  });

  return NextResponse.json({ level: 2, pending: true });
}
