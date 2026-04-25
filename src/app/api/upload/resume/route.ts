import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { R2_KEYS, uploadFile } from '@/lib/r2';
import { uploadRateLimiter } from '@/lib/rate-limit';
import {
  RESUME_MAX_BYTES,
  RESUME_MIME_TYPES,
} from '@/lib/validations/upload.schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await uploadRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (!RESUME_MIME_TYPES.includes(file.type as (typeof RESUME_MIME_TYPES)[number])) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (file.size > RESUME_MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const key = R2_KEYS.resume(session.user.id);
  const { url } = await uploadFile(file, key);

  await prisma.seekerProfile.update({
    where: { userId: session.user.id },
    data: { resumeKey: key },
  });

  return NextResponse.json({ data: { key, url } }, { status: 200 });
}
