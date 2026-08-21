import { NextRequest, NextResponse } from 'next/server';

import { sendPasswordResetEmail } from '@/lib/email/password-reset';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { RequestResetSchema } from '@/lib/validations/password-reset.schema';

const resetRequestLimiter = createRateLimiter('reset-password-request', 5, '15 m');
const resetRequestEmailLimiter = createRateLimiter('reset-password-request-email', 3, '15 m');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await resetRequestLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = RequestResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Per-email budget — IP spoofing can't bypass this, and it stops email
  // bombing of a victim's inbox (bursts of reset links to one address).
  const { success: emailOk } = await resetRequestEmailLimiter.limit(parsed.data.email);
  if (!emailOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      passwordHash: true,
      accounts: { select: { provider: true } },
    },
  });

  // Send to any existing user — including passwordless (Google-created) accounts,
  // so they can set a first password when Google sign-in is unavailable.
  if (user) {
    const mode = user.passwordHash ? 'reset' : 'set';
    await sendPasswordResetEmail(parsed.data.email, mode).catch((err: unknown) => {
      console.error('[reset-password] send failed (non-fatal):', err);
    });
  }

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}
