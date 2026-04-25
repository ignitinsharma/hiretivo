import { NextRequest, NextResponse } from 'next/server';

import { sendPasswordResetEmail } from '@/lib/email/password-reset';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { RequestResetSchema } from '@/lib/validations/password-reset.schema';

const resetRequestLimiter = createRateLimiter('reset-password-request', 5, '15 m');

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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { passwordHash: true },
  });

  if (user?.passwordHash) {
    sendPasswordResetEmail(parsed.data.email).catch((err: unknown) => {
      console.error('[reset-password] send failed (non-fatal):', err);
    });
  }

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}
