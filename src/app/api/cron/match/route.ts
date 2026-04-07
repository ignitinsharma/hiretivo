import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { computeAllMatches, upsertJobMatches } from '@/lib/match';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const seekers = await prisma.seekerProfile.findMany({
    select: { id: true },
  });

  let totalMatches = 0;
  for (const seeker of seekers) {
    const matches = await computeAllMatches(seeker.id);
    if (matches.length > 0) {
      await upsertJobMatches(seeker.id, matches);
      totalMatches += matches.length;
      await redis.del(`match:${seeker.id}`);
    }
  }

  return NextResponse.json({
    success: true,
    seekersProcessed: seekers.length,
    totalMatches,
  });
}
