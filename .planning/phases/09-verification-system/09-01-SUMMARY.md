---
phase: 09-verification-system
plan: 01
subsystem: database
tags: [prisma, postgres, billing, verification, cleanup]
requires: []
provides:
  - Pivot v2 Prisma schema with verification, unlock, feedback, and public profile fields
  - Four-tier recruiter billing constants
  - Removed boost, saved-job, dismissed-job, early-access, admin-jobs, and company legacy routes
  - Live Neon schema pushed with clean-slate data-loss changes
affects: [verification-system, talent-pool, matching, billing]
tech-stack:
  added: []
  patterns: [PlanTier STARTER/GROWTH/SCALE, numeric experience fields]
key-files:
  created:
    - src/constants/verification-reasons.ts
  modified:
    - prisma/schema.prisma
    - src/constants/enums.ts
    - src/constants/pricing.ts
    - src/constants/billing.ts
    - src/app/api/cron/seeker-digest/route.ts
key-decisions:
  - "Existing PRO/ENTERPRISE users were normalized to FREE before removing enum variants from Neon."
  - "Numeric minYearsExperience/yearsExperience migration was completed where needed for TypeScript compatibility."
patterns-established:
  - "Paid recruiter access checks now treat STARTER, GROWTH, and SCALE as paid tiers."
  - "Legacy promotion and saved/dismissed job APIs are removed rather than shimmed."
requirements-completed: [PIVS-01, PIVS-02, PIVS-12]
duration: 45min
completed: 2026-05-16
---

# Phase 09: Verification System Plan 01 Summary

**Pivot v2 clean-slate schema, recruiter tier constants, verification rejection reasons, and legacy route cleanup pushed to Neon**

## Performance

- **Duration:** 45 min
- **Started:** 2026-05-16T15:15:00Z
- **Completed:** 2026-05-16T15:59:27Z
- **Tasks:** 3
- **Files modified:** 68

## Accomplishments

- Added Pivot v2 Prisma enums, user/profile/job/application fields, and six new verification/talent marketplace models.
- Replaced PRO/ENTERPRISE billing constants with FREE/STARTER/GROWTH/SCALE and updated paid-plan checks.
- Deleted boost, fake jobs, early access, admin job/company routes, saved/dismissed job API routes, and disabled seeker digest with HTTP 410.
- Pushed the schema to Neon after normalizing two legacy paid-plan users to FREE.

## Task Commits

Pending orchestrator commit for this plan.

## Files Created/Modified

- `prisma/schema.prisma` - Pivot v2 schema with verification and marketplace models.
- `src/constants/enums.ts` - TypeScript enum mirrors for new PlanTier and verification enums.
- `src/constants/pricing.ts` - PLAN_TIERS and pricing card config for four recruiter tiers.
- `src/constants/billing.ts` - Dodo product mapping for STARTER/GROWTH/SCALE.
- `src/constants/verification-reasons.ts` - 14 admin rejection reasons.
- `src/app/api/cron/seeker-digest/route.ts` - Disabled cron returning 410 Gone.

## Decisions Made

- Existing live `PRO` and `ENTERPRISE` plan values were updated to `FREE` before the enum migration because PostgreSQL rejected removal while rows still referenced those values.
- Numeric experience fields were propagated through onboarding, job posting, job cards, and application responses to keep generated Prisma types and TypeScript aligned.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Live PlanTier enum migration failed**
- **Found during:** Task 1 schema push
- **Issue:** Neon rejected removing `PRO` and `ENTERPRISE` because two users still used removed enum values.
- **Fix:** Updated those users to `FREE`, then reran `prisma db push --accept-data-loss` successfully.
- **Files modified:** None; live database data normalized.
- **Verification:** `prisma db push --accept-data-loss` completed successfully.
- **Committed in:** Pending orchestrator commit.

**2. [Rule 3 - Blocking] Removed Prisma fields broke TypeScript consumers**
- **Found during:** Task 2 TypeScript verification
- **Issue:** Generated Prisma types no longer exposed `experienceLevel`, `BoostedJob`, `SavedJob`, or `DismissedJob`.
- **Fix:** Replaced experience-level consumers with numeric fields and removed legacy API/component references to deleted models.
- **Files modified:** onboarding actions, job routes, pricing, billing, seeker feed, recruiter job detail, job/application types.
- **Verification:** `pnpm exec tsc --noEmit` passes.
- **Committed in:** Pending orchestrator commit.

---

**Total deviations:** 2 auto-fixed (blocking)
**Impact on plan:** Required to make the planned clean-slate schema actually compile and push. No new product surface was introduced.

## Issues Encountered

- Prisma warned about expected data loss for removed job fields and legacy saved/dismissed tables during `db push`.
- `.next/types` contained stale generated route references after deleting routes; `.next` was cleared before TypeScript verification.

## User Setup Required

None - Neon schema was pushed from the local environment.

## Next Phase Readiness

Wave 2 can reference `VerificationStatus`, `ApplicationSource`, `ContractType`, `profileSlug`, `salaryMinUsd`, `salaryMaxUsd`, `minYearsExperience`, and the verification review models from Prisma and TypeScript constants.

---
*Phase: 09-verification-system*
*Completed: 2026-05-16*
