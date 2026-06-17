import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobStatus, WorkType, JobType } from '@/constants/enums';
import { generateUnsubscribeToken } from '@/lib/unsubscribe-token';
import { sendWeeklyDigestEmail } from '@/lib/email/weekly-digest';
import { APP_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const DIGEST_BATCH_SIZE = 25;
const MIN_MATCH_SCORE = 30;
const MAX_JOBS_PER_EMAIL = 5;
const DEDUP_WINDOW_MS = 6 * 24 * 60 * 60 * 1000; // 6 days

/*
 * GET /api/cron/weekly-digest
 * Vercel Cron endpoint — fires every Monday 9am UTC.
 * Sends personalized job digest emails to eligible seekers.
 * Protected by CRON_SECRET header (Vercel injects automatically).
 * Processes up to DIGEST_BATCH_SIZE seekers per invocation.
 * Skips seekers with no qualifying matches or sent within 6 days.
 * @returns JSON summary of sent/skipped counts
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sixDaysAgo = new Date(Date.now() - DEDUP_WINDOW_MS);

  const seekers = await prisma.seekerProfile.findMany({
    where: {
      digestEnabled: true,
      OR: [
        { lastDigestSentAt: null },
        { lastDigestSentAt: { lt: sixDaysAgo } },
      ],
    },
    take: DIGEST_BATCH_SIZE,
    select: {
      id: true,
      user: {
        select: { id: true, email: true, name: true },
      },
      jobMatches: {
        where: {
          score: { gte: MIN_MATCH_SCORE },
          job: { status: JobStatus.OPEN },
        },
        orderBy: { score: 'desc' },
        take: MAX_JOBS_PER_EMAIL,
        select: {
          score: true,
          job: {
            select: {
              id: true,
              title: true,
              companyName: true,
              workType: true,
              jobType: true,
              recruiter: {
                select: {
                  recruiterProfile: {
                    select: { companyName: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const seeker of seekers) {
    // Skip seekers with no email (OAuth users who denied email scope)
    if (!seeker.user.email) {
      skipped++;
      continue;
    }

    // Skip seekers with no qualifying matches
    if (seeker.jobMatches.length === 0) {
      skipped++;
      continue;
    }

    const token = generateUnsubscribeToken(seeker.user.id);
    const unsubscribeUrl = `${APP_URL}/api/seeker/unsubscribe?token=${token}&uid=${encodeURIComponent(seeker.user.id)}`;

    const jobs = seeker.jobMatches.map((m) => ({
      id: m.job.id,
      title: m.job.title,
      companyName:
        m.job.companyName ??
        m.job.recruiter.recruiterProfile?.companyName ??
        'Company',
      workType: m.job.workType as WorkType | null,
      jobType: m.job.jobType as JobType,
      score: m.score,
    }));

    try {
      await sendWeeklyDigestEmail({
        toEmail: seeker.user.email,
        seekerName: seeker.user.name ?? 'there',
        jobs,
        unsubscribeUrl,
        baseUrl: APP_URL,
      });

      await prisma.seekerProfile.update({
        where: { id: seeker.id },
        data: { lastDigestSentAt: new Date() },
      });

      sent++;
    } catch (err) {
      // Log but continue — one failed send must not block others
      console.error(`[digest] Failed to send to seeker ${seeker.id}:`, err);
      skipped++;
    }
  }

  return Response.json({ sent, skipped }, { status: 200 });
}
