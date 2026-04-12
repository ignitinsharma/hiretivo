# Plan 05: Rate Limiting — Summary

**Status:** Complete
**Type:** implementation

## What was built

Applied rate limiting to all sensitive API routes using the existing `createRateLimiter` utility.

## Rate Limits Added

| Route | Method | Limiter | Limit | Key |
|-------|--------|---------|-------|-----|
| `/api/applications` | POST | `applyRateLimiter` | 5/min | IP (already existed) |
| `/api/recruiter/applications/[id]/stage` | PATCH | `stageUpdateRateLimiter` | 30/min | userId |
| `/api/recruiter/settings` | PATCH | `settingsRateLimiter` | 20/min | userId |
| `/api/auth/change-password` | PATCH | `passwordChangeRateLimiter` | 5/min | IP |
| `/api/jobs` | GET | `jobListRateLimiter` | 60/min | userId |
| `/api/seeker/feed` | GET | `feedRateLimiter` | 30/min | userId |

## Notes
- Password change and application submission use IP-based limiting (unauthenticated or security-sensitive)
- All other routes use userId-based limiting (authenticated)
- Cron routes (`/api/cron/*`) are exempt — protected by `VercelCronSecret` instead
- Read-only public routes (GET `/api/jobs` public search) not rate-limited — they're cached
