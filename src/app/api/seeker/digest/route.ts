import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { UserRole } from '@/constants/enums';
import { z } from 'zod';

const rateLimiter = createRateLimiter('seeker-digest', 10, '1 m');

const PatchBodySchema = z.object({
  enabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return new Response('Forbidden', { status: 403 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { digestEnabled: true },
  });

  return Response.json(
    {
      data: {
        enabled: seekerProfile?.digestEnabled ?? false,
        lastSentAt: null,
      },
    },
    { status: 200 },
  );
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return new Response('Forbidden', { status: 403 });
  }

  const { success } = await rateLimiter.limit(session.user.id);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const body: unknown = await req.json();
  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seekerProfile) {
    return new Response('Not found', { status: 404 });
  }

  await prisma.seekerProfile.update({
    where: { id: seekerProfile.id },
    data: { digestEnabled: parsed.data.enabled },
  });

  return Response.json(
    {
      data: {
        enabled: parsed.data.enabled,
        lastSentAt: null,
      },
    },
    { status: 200 },
  );
}
