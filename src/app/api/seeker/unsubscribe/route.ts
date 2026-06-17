import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';
import { createRateLimiter, getRateLimitIp } from '@/lib/rate-limit';
import { APP_URL } from '@/lib/config';

const rateLimiter = createRateLimiter('unsubscribe', 10, '1 m');

/*
 * GET /api/seeker/unsubscribe
 * Unauthenticated endpoint — verifies HMAC token then disables digest.
 * Linked from every digest email footer. No login required.
 * Query params: token (HMAC hex), uid (userId)
 * On success: redirects to /unsubscribe?success=true
 * On failure: redirects to /unsubscribe?error=invalid
 */
export async function GET(req: NextRequest) {
  const ip = getRateLimitIp(req);
  const { success } = await rateLimiter.limit(ip);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  if (!token || !uid) {
    return NextResponse.redirect(`${APP_URL}/unsubscribe?error=invalid`);
  }

  const valid = verifyUnsubscribeToken(uid, token);
  if (!valid) {
    return NextResponse.redirect(`${APP_URL}/unsubscribe?error=invalid`);
  }

  // Idempotent — safe to run even if already unsubscribed
  const seekerProfile = await prisma.seekerProfile.findFirst({
    where: { userId: uid },
    select: { id: true },
  });

  if (!seekerProfile) {
    // User may have deleted their account — treat as success (nothing to disable)
    return NextResponse.redirect(`${APP_URL}/unsubscribe?success=true`);
  }

  await prisma.seekerProfile.update({
    where: { id: seekerProfile.id },
    data: { digestEnabled: false },
  });

  return NextResponse.redirect(`${APP_URL}/unsubscribe?success=true`);
}
