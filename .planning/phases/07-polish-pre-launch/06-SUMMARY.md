# Plan 06: Vercel Cron — Stale Job Nudge Emails — Summary

**Status:** Complete
**Type:** implementation

## What was built

Daily Vercel Cron job that emails recruiters about jobs that have been open for 30+ days.

## Files Created

| File | Purpose |
|------|---------|
| `src/app/api/cron/stale-jobs/route.ts` | Cron handler — queries stale jobs, sends nudge emails |
| `src/lib/email/stale-job-nudge.ts` | Email template and send function for stale job nudges |

## Files Modified

| File | Change |
|------|--------|
| `vercel.json` | Added second cron entry: `/api/cron/stale-jobs` at `0 9 * * *` (daily at 9 AM UTC) |

## How it works

1. Vercel Cron triggers `/api/cron/stale-jobs` daily at 9 AM UTC
2. Route verifies `Bearer ${CRON_SECRET}` header
3. Queries for `OPEN` jobs created >30 days ago
4. For each stale job, sends nudge email to the recruiter
5. Returns JSON with `nudgesSent`, `totalStaleJobs`, and any errors

## Email Content
- Subject: `Your job "{title}" hasn't had activity in {N} days`
- Body: Personalized nudge with CTA to "View Your Jobs"
- Includes plain-text fallback
