import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { R2_KEYS, uploadFile } from '@/lib/r2';
import { uploadRateLimiter } from '@/lib/rate-limit';
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
} from '@/lib/validations/upload.schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 });
  }

  const key = R2_KEYS.avatar(session.user.id);
  const { url } = await uploadFile(file, key);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: key },
  });

  return NextResponse.json({ data: { key, url } }, { status: 200 });
}
