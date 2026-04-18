import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { z } from 'zod';

const digestRateLimiter = createRateLimiter("seeker-digest", 10, "1 m");

const DigestPreferenceSchema = z.object({
  enabled: z.boolean(),
});

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      digestEnabled: true,
      lastDigestSentAt: true,
    },
  });

  return NextResponse.json({
    data: {
      enabled: user?.digestEnabled ?? false,
      lastSentAt: user?.lastDigestSentAt?.toISO() ?? null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await digestRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = DigestPreferenceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { digestEnabled: parsed.data.enabled },
  });

  return NextResponse.json({ data: { success: true } });
}