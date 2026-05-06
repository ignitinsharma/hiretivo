import { NextRequest, NextResponse } from 'next/server';

import { getSignedFileUrl } from '@/lib/r2';
import { getRateLimitIp, publicReadRateLimiter } from '@/lib/rate-limit';

const ALLOWED_PREFIXES = ['company-logos/', 'avatars/'];

/*
 * GET /api/logo
 * Proxies allowed private R2 image keys through a signed URL fetch.
 * Returns image bytes, invalid-key errors, not-found, or rate-limit errors.
 */
export async function GET(req: NextRequest) {
  const { success } = await publicReadRateLimiter.limit(getRateLimitIp(req));
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (!key || !ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    return new NextResponse('Invalid key', { status: 400 });
  }

  try {
    const signedUrl = await getSignedFileUrl(key);
    const r2Res = await fetch(signedUrl);
    if (!r2Res.ok) return new NextResponse('Not found', { status: 404 });

    const contentType = r2Res.headers.get('content-type') ?? 'image/webp';
    const body = await r2Res.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
