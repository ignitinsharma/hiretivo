import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter } from "@/lib/rate-limit";
import { sendVerificationReviewEmail } from "@/lib/email/verification-review";

const adminVerificationWriteLimiter = createRateLimiter("admin-verification-write", 5, "1 m");

const reviewBodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
});

/*
 * POST /api/admin/verification/[id]/review
 * Approves or rejects a seeker's verification request.
 * Sets User.verificationStatus, updates SeekerProfile review metadata,
 * inserts a VerificationReview audit row, and sends a result email (non-fatal).
 * Returns 403 for non-admin, 404 if user not found, 400 on bad body, 429 on rate limit.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success } = await adminVerificationWriteLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { action, notes } = parsed.data;

  // Confirm the target user exists and is a SEEKER
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || user.role !== "SEEKER") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newStatus = action === "APPROVE" ? "VERIFIED" : "REJECTED";
  const reviewedBy = session!.user?.email ?? "admin";
  const reviewedAt = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.id },
      data: { verificationStatus: newStatus },
    }),
    prisma.seekerProfile.update({
      where: { userId: params.id },
      data: {
        verificationNotes: notes ?? null,
        verificationReviewedAt: reviewedAt,
        verificationReviewedBy: reviewedBy,
      },
    }),
    prisma.verificationReview.create({
      data: {
        userId: params.id,
        status: newStatus,
        reviewedBy,
        notes: { action, notes: notes ?? null },
      },
    }),
  ]);

  // Fire-and-forget email — non-fatal
  if (user.email) {
    sendVerificationReviewEmail({
      toEmail: user.email,
      recipientName: user.name,
      approved: action === "APPROVE",
      notes: notes ?? null,
    }).catch((err: unknown) => {
      console.error("[verification-review] email failed", err);
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
