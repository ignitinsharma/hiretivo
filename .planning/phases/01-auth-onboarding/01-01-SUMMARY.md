---
phase: 01-auth-onboarding
plan: 01
subsystem: database
tags: [prisma, postgresql, neon, schema-migration, wizard-fields]

# Dependency graph
requires: []
provides:
  - SeekerProfile model with 6 wizard fields: situation, primaryRole, salaryMin, salaryMax, currency, availability
  - RecruiterProfile model with companySize field
  - Prisma client regenerated with new nullable field types
  - SQL migration applied to Neon DB
affects:
  - 01-04 (seeker wizard server actions write situation, primaryRole, salary, availability to SeekerProfile)
  - 01-05 (recruiter onboarding server action writes companySize to RecruiterProfile)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wizard fields stored as nullable String/Int — avoids schema churn when UI enums evolve"
    - "DB drift handled via prisma db execute with manual SQL rather than prisma migrate dev (DB ahead of migration history)"

key-files:
  created:
    - prisma/migrations/20260402000000_add_wizard_fields/migration.sql
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Used prisma db execute instead of prisma migrate dev because development DB had schema drift (extra columns applied outside migration history)"
  - "Stored wizard enum values (situation, availability) as String? not DB enums — UI enum options can evolve without schema churn"

patterns-established:
  - "When DB drifts ahead of migration history, use prisma db execute for targeted SQL rather than migrate reset (preserves data)"

requirements-completed: [AUTH-05, AUTH-06, AUTH-07, AUTH-09]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 1 Plan 01: Prisma Schema — Wizard Fields Migration Summary

**7 nullable wizard fields added to SeekerProfile (situation, primaryRole, salary range, currency, availability) and RecruiterProfile (companySize) via targeted SQL migration on drifted Neon DB**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T10:46:59Z
- **Completed:** 2026-04-02T10:50:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added 6 nullable fields to SeekerProfile: situation (String?), primaryRole (String?), salaryMin (Int?), salaryMax (Int?), currency (String?), availability (String?)
- Added 1 nullable field to RecruiterProfile: companySize (String?)
- Regenerated Prisma client — all new fields visible in generated TypeScript types (e.g. `situation: string | null`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add wizard fields to SeekerProfile and companySize to RecruiterProfile** - `4c775e7` (feat)
2. **Task 2: Run Prisma migration to apply schema changes** - `9ca0952` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified

- `prisma/schema.prisma` - Added 7 nullable fields to SeekerProfile and RecruiterProfile models
- `prisma/migrations/20260402000000_add_wizard_fields/migration.sql` - SQL ALTER TABLE statements for the 5 new SeekerProfile columns not yet in DB

## Decisions Made

- Used `prisma db execute` with manual SQL instead of `prisma migrate dev` because the development Neon DB had schema drift (extra columns: onboardingStep, photo, resumeUrl, city, country, timezone, expectedSalary, salaryUnit, description, industry, logo were present in DB but not in schema). Running `migrate dev` would have required a reset, destroying data.
- `primaryRole` and `companySize` were already present in DB (per drift report), so the migration only added: situation, salaryMin, salaryMax, currency, availability to SeekerProfile.
- All wizard fields stored as String?/Int? (not DB enums) so UI enum options can evolve without requiring schema migrations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used prisma db execute instead of prisma migrate dev due to DB drift**
- **Found during:** Task 2 (Run Prisma migration)
- **Issue:** `prisma migrate dev` detected drift (extra columns in DB not in schema) and refused to proceed without `migrate reset`, which would destroy data
- **Fix:** Created manual SQL migration file with `IF NOT EXISTS` guards; ran via `prisma db execute`. Then ran `prisma generate` to regenerate client.
- **Files modified:** prisma/migrations/20260402000000_add_wizard_fields/migration.sql
- **Verification:** `prisma validate` exits 0; `prisma generate` succeeds; generated index.d.ts contains `situation: string | null`
- **Committed in:** `9ca0952` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - handled DB drift to avoid data loss)
**Impact on plan:** Auto-fix achieved identical outcome to planned migration — new columns in DB, client regenerated. No scope creep.

## Issues Encountered

- DB had 10+ extra columns not in schema.prisma, causing migration drift. Some of the 7 planned fields (primaryRole, companySize) already existed in DB from prior manual changes. Only 5 columns needed to be added via SQL.

## User Setup Required

None - no external service configuration required. Migration was applied directly to the Neon DB using existing DATABASE_URL.

## Next Phase Readiness

- SeekerProfile now has all fields needed by seeker wizard server actions (Plan 04)
- RecruiterProfile now has companySize needed by recruiter onboarding server action (Plan 05)
- Prisma client types updated — Plans 04 and 05 can reference `situation`, `primaryRole`, `salaryMin`, `salaryMax`, `currency`, `availability`, `companySize` without type errors
- No blockers for subsequent plans in Phase 1

---
*Phase: 01-auth-onboarding*
*Completed: 2026-04-02*
