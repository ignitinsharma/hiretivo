/*
 * POST /api/feedback/employer
 * Validates JWT token, creates EmployerFeedback record, marks FeedbackRequest
 * as used, and triggers Hiretivo Score recalculation.
 * No auth required — public endpoint gated by JWT token validity.
 * Rate limited: 10 req/min per IP (low volume, no auth).
 * Body: { token: string, rating: number (1-5), comment?: string }
 * Returns 200 on success, 400 on invalid/expired/used token.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errors } from "jose";
import { prisma } from "@/lib/prisma";
import { verifyFeedbackToken, hashToken } from "@/lib/feedback-token";
import { createRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { VerificationStatus } from "@/constants/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Rate limit: 10 req/min per IP — public endpoint, low volume */
const feedbackRateLimiter = createRateLimiter("feedback-submit", 10, "1 m");

const FeedbackSubmitSchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getRateLimitIp(req);
  const { success: withinLimit } = await feedbackRateLimiter.limit(ip);
  if (!withinLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Validate request body
  const parsed = FeedbackSubmitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, rating, comment } = parsed.data;

  // Step 1: Verify JWT signature + decode payload
  let payload;
  try {
    payload = await verifyFeedbackToken(token);
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      return NextResponse.json({ error: "expired" }, { status: 400 });
    }
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  // Step 2: Hash token and look up FeedbackRequest in DB
  const tokenHash = hashToken(token);
  const record = await prisma.feedbackRequest.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  if (record.usedAt) {
    return NextResponse.json({ error: "already_used" }, { status: 400 });
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }

  // Step 3: Verify payload matches DB record (prevents token forgery)
  if (
    payload.engineerId !== record.engineerId ||
    payload.feedbackRequestId !== record.id
  ) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  // Step 4: Create EmployerFeedback + mark FeedbackRequest used in transaction
  await prisma.$transaction([
    prisma.employerFeedback.create({
      data: {
        engineerId: record.engineerId,
        recruiterId: record.recruiterId,
        jobId: record.jobId,
        feedbackRequestId: record.id,
        rating,
        comment,
      },
    }),
    prisma.feedbackRequest.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Step 5: Recalculate Hiretivo Score (LOCKED formula from CONTEXT.md)
  const latestReview = await prisma.verificationReview.findFirst({
    where: { userId: record.engineerId, status: VerificationStatus.VERIFIED },
    orderBy: { createdAt: "desc" },
  });
  const scoreGiven = latestReview?.scoreGiven ?? 50;

  const { _avg } = await prisma.employerFeedback.aggregate({
    where: { engineerId: record.engineerId },
    _avg: { rating: true },
  });
  const avgRating = _avg.rating ?? 0;

  const newScore = Math.round(
    scoreGiven * 0.85 + (avgRating / 5) * 100 * 0.15
  );

  await prisma.user.update({
    where: { id: record.engineerId },
    data: { hiretivoScore: newScore, scoreUpdatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
