import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { getR2Client } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ seekerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { seekerId } = await params;

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: seekerId },
    select: { resumeKey: true },
  });

  if (!profile?.resumeKey) {
    return NextResponse.json(
      { error: 'This candidate has not uploaded a resume.' },
      { status: 404 }
    );
  }

  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: profile.resumeKey,
    });

    const response = await getR2Client().send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: 'Resume file is empty.' },
        { status: 404 }
      );
    }

    const contentType = response.ContentType ?? 'application/pdf';
    const contentLength = response.ContentLength;

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="resume-${seekerId}.pdf"`);
    if (typeof contentLength === 'number') {
      headers.set('Content-Length', String(contentLength));
    }
    headers.set('Cache-Control', 'private, max-age=3600');

    return new NextResponse(response.Body as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';

    if (message.includes('NoSuchKey') || message.includes('404')) {
      return NextResponse.json(
        { error: 'Resume file not found in storage. The candidate may need to re-upload their resume.' },
        { status: 404 }
      );
    }

    console.error('[ResumeProxy] Failed to stream resume:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve resume.' },
      { status: 500 }
    );
  }
}