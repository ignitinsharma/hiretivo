import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { JobStatus, VerificationStatus } from '@/constants/enums'
import { computeWeightedJobMatch } from '@/lib/match'
import { sendJobMatchNotification } from '@/lib/email/job-match-notification'
import { format } from 'date-fns'

const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev-secret'
const MATCH_THRESHOLD = 60

/*
 * GET /api/cron/job-match-notification
 * Daily cron: finds jobs posted in the last 24hrs, computes weighted match scores
 * for all VERIFIED engineers, and sends a digest to engineers with score >= 60.
 * Rate limit: max 1 digest per engineer per calendar day via Redis.
 * Schedule: daily at 09:00 UTC (vercel.json)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const todayKey = format(now, 'yyyy-MM-dd')

  // 1. Fetch new OPEN jobs published in last 24hrs
  const newJobs = await prisma.job.findMany({
    where: {
      status: JobStatus.OPEN,
      publishedAt: { gte: since },
    },
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true,
      minYearsExperience: true,
      timezoneOverlapHours: true,
      skills: { select: { skill: { select: { name: true } } } },
      recruiter: {
        select: { recruiterProfile: { select: { companyName: true } } },
      },
    },
  })

  if (newJobs.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, reason: 'no_new_jobs' })
  }

  // 2. Fetch all VERIFIED engineers with their match-relevant fields
  const engineers = await prisma.user.findMany({
    where: { verificationStatus: VerificationStatus.VERIFIED },
    select: {
      id: true,
      email: true,
      name: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          yearsExperience: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
    take: 500, // hard cap per run -- scale with pagination later
  })

  let processed = 0
  let sent = 0
  let skipped = 0

  for (const engineer of engineers) {
    if (!engineer.email) { skipped++; continue }

    // Rate limit: 1 digest per engineer per day
    const redisKey = `job-match-notif:${engineer.id}:${todayKey}`
    const already = await redis.get(redisKey)
    if (already) { skipped++; continue }

    const engineerSkills = engineer.seekerProfile?.skills.map(s => s.skill.name) ?? []

    // Score each new job for this engineer
    const scoredJobs = newJobs
      .map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.recruiter.recruiterProfile?.companyName ?? 'Unknown Company',
        matchScore: computeWeightedJobMatch({
          engineerSkills,
          jobRequiredSkills: job.skills.map(s => s.skill.name),
          engineerSalaryMin: engineer.seekerProfile?.salaryMinUsd ?? null,
          engineerSalaryMax: engineer.seekerProfile?.salaryMaxUsd ?? null,
          jobSalaryMin: job.salaryMin ?? null,
          jobSalaryMax: job.salaryMax ?? null,
          engineerYearsExp: engineer.seekerProfile?.yearsExperience ?? null,
          jobYearsExpRequired: job.minYearsExperience ?? null,
          engineerTimezoneOverlapHours: engineer.timezoneOverlapHours ?? null,
          jobTimezoneOverlapHours: job.timezoneOverlapHours ?? null,
          engineerAvailableFrom: engineer.availableFrom ?? null,
        }),
      }))
      .filter(j => j.matchScore >= MATCH_THRESHOLD)
      .sort((a, b) => b.matchScore - a.matchScore)

    if (scoredJobs.length === 0) { processed++; continue }

    try {
      await sendJobMatchNotification(
        engineer.email,
        engineer.name,
        scoredJobs.slice(0, 3),
        scoredJobs.length,
      )
      // Mark as sent for today -- TTL 25hrs to avoid edge-of-day gaps
      await redis.set(redisKey, '1', { ex: 25 * 60 * 60 })
      sent++
    } catch (err) {
      console.error(`[job-match-notif] Failed for engineer ${engineer.id}:`, err)
    }
    processed++
  }

  return NextResponse.json({ processed, sent, skipped, timestamp: now.toISOString() })
}
