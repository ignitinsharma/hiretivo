import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getSignedFileUrl } from '@/lib/r2';
import { UserRole } from '@/constants/enums';
import { dataFetchRateLimiter } from '@/lib/rate-limit';

/*
 * GET /api/upload/resume/view
 * Creates a temporary signed URL for the authenticated seeker's resume.
 * Returns the signed URL or auth/not-found/rate-limit errors.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { resumeKey: true },
  });

  if (!profile?.resumeKey) {
    return NextResponse.json({ error: 'No resume found' }, { status: 404 });
  }

  const url = await getSignedFileUrl(profile.resumeKey);
  return NextResponse.json({ data: { url } });
}
