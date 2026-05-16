import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { auth } from "@/auth";
import { VerificationStatus } from "@/constants/enums";
import {
  REJECTION_REASONS,
  type RejectionReasonKey,
} from "@/constants/verification-reasons";
import { sendApprovalEmail } from "@/lib/emails/verification-approval";
import { sendRejectionEmail } from "@/lib/emails/verification-rejection";
import { prisma } from "@/lib/prisma";
import { verificationWriteRateLimiter } from "@/lib/rate-limit";

interface RouteContext {
  params: { id: string };
}

type AdminSession = {
  user?: {
    id?: string;
    email?: string | null;
  };
} | null;

const REJECTION_REASON_KEYS = REJECTION_REASONS.map((reason) => reason.key) as [
  RejectionReasonKey,
  ...RejectionReasonKey[],
];

/** Shared aiSummary field for LOCKED audit trail shape (from 12-CONTEXT.md) */
const aiSummarySchema = z
  .object({
    model: z.string(),
    promptVersion: z.string(),
    inputSnapshot: z.object({
      repos: z.number(),
      languages: z.array(z.string()),
      lastCommit: z.string(),
      starCount: z.number(),
    }),
    output: z.object({
      recommendation: z.enum(["APPROVE", "REJECT"]),
      confidence: z.number().min(0).max(1),
      scoreSuggestion: z.number().int().min(0).max(100),
      reasons: z.array(z.string()),
      summary: z.string(),
    }),
    overrideReason: z.string().max(500).optional(),
  })
  .optional();

const reviewSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVED"),
    score: z.number().int().min(0).max(100),
    overrideReason: z.string().max(500).optional(),
    aiSummary: aiSummarySchema,
  }),
  z.object({
    decision: z.literal("REJECTED"),
    reasons: z
      .array(z.enum(REJECTION_REASON_KEYS))
      .min(1, "Select at least one rejection reason"),
    customNote: z.string().trim().max(1000).optional(),
    reapplyDays: z.union([z.literal(30), z.literal(60), z.literal(90)]),
    overrideReason: z.string().max(500).optional(),
    aiSummary: aiSummarySchema,
  }),
]);

/*
 * requireAdmin
 * Checks whether the current session email matches ADMIN_EMAIL.
 * Returns true only for an authenticated configured admin user.
 */
function requireAdmin(session: AdminSession): boolean {
  if (!session?.user?.email) return false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session.user.email.trim().toLowerCase();

  return Boolean(adminEmail && userEmail === adminEmail);
}

/*
 * POST /api/admin/verification/[id]/review
 * Approves or rejects an IN_REVIEW verification submission.
 * Persists a VerificationReview audit record and sends the outcome email.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const isAdmin = requireAdmin(session);
  if (!session?.user?.id || !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await verificationWriteRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const engineer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      verificationStatus: true,
      profileSlug: true,
    },
  });
  if (!engineer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!engineer.email) {
    return NextResponse.json(
      { error: "Engineer email is required before review" },
      { status: 409 },
    );
  }
  if (engineer.verificationStatus !== VerificationStatus.IN_REVIEW) {
    return NextResponse.json(
      { error: "Engineer is not IN_REVIEW and cannot be reviewed" },
      { status: 409 },
    );
  }

  const adminEmail = session.user.email;

  if (parsed.data.decision === "APPROVED") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: params.id },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          hiretivoScore: parsed.data.score,
          scoreUpdatedAt: new Date(),
        },
      }),
      prisma.seekerProfile.update({
        where: { userId: params.id },
        data: {
          verificationReviewedAt: new Date(),
          verificationReviewedBy: adminEmail,
        },
      }),
      prisma.verificationReview.create({
        data: {
          userId: params.id,
          reviewedBy: adminEmail,
          status: VerificationStatus.VERIFIED,
          scoreGiven: parsed.data.score,
          aiSummary: parsed.data.aiSummary ?? undefined,
        },
      }),
    ]);

    await sendApprovalEmail({
      to: engineer.email,
      name: engineer.name ?? "Engineer",
      score: parsed.data.score,
      profileSlug: engineer.profileSlug ?? "",
    }).catch((error: unknown) => {
      console.error("[verification review] Approval email failed", {
        engineerId: engineer.id,
        error,
      });
    });
  } else {
    const reapplyAfter = addDays(new Date(), parsed.data.reapplyDays);
    const customNote = parsed.data.customNote ?? "";

    await prisma.$transaction([
      prisma.user.update({
        where: { id: params.id },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          reapplyAfter,
        },
      }),
      prisma.seekerProfile.update({
        where: { userId: params.id },
        data: {
          verificationNotes: customNote || null,
          verificationReviewedAt: new Date(),
          verificationReviewedBy: adminEmail,
        },
      }),
      prisma.verificationReview.create({
        data: {
          userId: params.id,
          reviewedBy: adminEmail,
          status: VerificationStatus.REJECTED,
          notes: {
            reasons: parsed.data.reasons,
            customNote,
            reapplyDays: parsed.data.reapplyDays,
          },
          aiSummary: parsed.data.aiSummary ?? undefined,
        },
      }),
    ]);

    await sendRejectionEmail({
      to: engineer.email,
      name: engineer.name ?? "Engineer",
      reasons: parsed.data.reasons,
      customNote,
      reapplyAfter,
    }).catch((error: unknown) => {
      console.error("[verification review] Rejection email failed", {
        engineerId: engineer.id,
        error,
      });
    });
  }

  return NextResponse.json({ success: true });
}
