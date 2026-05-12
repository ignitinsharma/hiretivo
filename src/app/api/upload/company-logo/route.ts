import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { R2_KEYS, uploadFile } from '@/lib/r2';
import { uploadRateLimiter } from '@/lib/rate-limit';
import { compressImageOnServer } from '@/lib/image.server';
import {
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
} from '@/lib/validations/upload.schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
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

  if (!LOGO_MIME_TYPES.includes(file.type as (typeof LOGO_MIME_TYPES)[number])) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (file.size > LOGO_MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    const { buffer, mimeType } = await compressImageOnServer(raw, file.type);
    const optimized = new File([new Uint8Array(buffer)], 'logo.webp', { type: mimeType });
    const key = R2_KEYS.companyLogo(session.user.id);
    const { url } = await uploadFile(optimized, key);

    await prisma.recruiterProfile.update({
      where: { userId: session.user.id },
      data: { logo: key },
    });

    return NextResponse.json({ data: { key, url } }, { status: 200 });
  } catch (error) {
    console.error('[upload/company-logo] Failed to process image:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 400 });
  }
}
