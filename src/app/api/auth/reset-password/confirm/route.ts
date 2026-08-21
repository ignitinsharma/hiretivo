import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { consumePasswordResetToken } from '@/lib/email/password-reset';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { ConfirmResetSchema } from '@/lib/validations/password-reset.schema';

const resetConfirmLimiter = createRateLimiter('reset-password-confirm', 5, '15 m');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await resetConfirmLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = ConfirmResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ok = await consumePasswordResetToken(
    parsed.data.email,
    parsed.data.token,
  );
  if (!ok) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Bump only for real resets: previously issued JWTs die. An OAuth user
      // setting a first password keeps their existing Google sessions.
      ...(user.passwordHash ? { passwordChangedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}
