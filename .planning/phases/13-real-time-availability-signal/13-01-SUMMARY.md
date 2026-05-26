---
phase: 13
plan: "13-01"
subsystem: database-schema
tags: [prisma, schema, enum, typescript, seeking-status]
dependency_graph:
  requires: []
  provides: [SeekingStatus enum in Prisma schema, User.seekingStatus field, TypeScript SeekingStatus enum]
  affects: [downstream plans 13-02 through 13-05]
tech_stack:
  added: []
  patterns: [Prisma enum definition, TypeScript enum mirroring pattern]
key_files:
  created: []
  modified:
    - prisma/schema.prisma
    - src/constants/enums.ts
decisions:
  - Default is OPEN_TO_OFFERS (not ACTIVELY_LOOKING) to avoid flooding the actively-looking filter with stale data from existing users
  - SeekingStatus placed after ContractType enum in schema (with other status enums)
  - seekingStatus field placed after hiddenUntil in User model (both are visibility-related)
metrics:
  duration: "~15 min"
  completed: "2026-05-26T11:52:18Z"
  tasks_completed: 3
  files_modified: 2
---

# Phase 13 Plan 01: SeekingStatus Schema Foundation Summary

**One-liner:** Prisma enum `SeekingStatus` (3 members) + `User.seekingStatus @default(OPEN_TO_OFFERS)` field + TypeScript mirror enum with values tuple.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add SeekingStatus enum and User.seekingStatus to Prisma schema | 4ac1a0c | prisma/schema.prisma |
| 2 | Mirror SeekingStatus in TypeScript enums file | 1fce0b9 | src/constants/enums.ts |
| 3 | Push schema to Neon + regenerate Prisma client | (no commit — prisma generate only) | node_modules (generated) |

## Schema Changes (prisma/schema.prisma)

Lines added (7):
```prisma
enum SeekingStatus {
  ACTIVELY_LOOKING
  OPEN_TO_OFFERS
  NOT_LOOKING
}
```

In `model User {}` after `hiddenUntil DateTime?`:
```prisma
seekingStatus        SeekingStatus      @default(OPEN_TO_OFFERS)
```

## TypeScript Changes (src/constants/enums.ts)

Lines added (12):
```ts
export enum SeekingStatus {
  ACTIVELY_LOOKING = "ACTIVELY_LOOKING",
  OPEN_TO_OFFERS = "OPEN_TO_OFFERS",
  NOT_LOOKING = "NOT_LOOKING",
}

export const SEEKING_STATUS_VALUES = [
  SeekingStatus.ACTIVELY_LOOKING,
  SeekingStatus.OPEN_TO_OFFERS,
  SeekingStatus.NOT_LOOKING,
] as const;
```

## Prisma DB Push Status

`npx prisma db push` — BLOCKED: Neon database not reachable from execution environment (`P1001: Can't reach database server`). This is the known environment blocker documented in STATE.md.

`npx prisma generate` — SUCCESS: Prisma client regenerated. `SeekingStatus` is exported from `@prisma/client` with all three members:
```json
{"ACTIVELY_LOOKING":"ACTIVELY_LOOKING","OPEN_TO_OFFERS":"OPEN_TO_OFFERS","NOT_LOOKING":"NOT_LOOKING"}
```

**Action required:** Run `npx prisma db push` once from an environment with Neon connectivity before deploying downstream plans.

## Default Value Confirmed

`seekingStatus` defaults to `OPEN_TO_OFFERS` — so existing users are in a neutral "open but passive" state rather than flooding the "actively looking" filter.

## Deviations from Plan

### Blocker: Neon DB unreachable

**Found during:** Task 3
**Issue:** `DATABASE_URL` in `.env.local` points to Neon pooler (`ep-hidden-haze-a18fvg88-pooler.ap-southeast-1.aws.neon.tech:5432`) but the database is not reachable from the execution environment (P1001 error). This matches the known blocker in STATE.md: "Live Prisma migration/push requires a reachable Neon DATABASE_URL."
**Fix:** `prisma generate` was run successfully so the Prisma Client is up-to-date locally. The `db push` must be run manually from an environment with Neon access (local dev or CI with DB connectivity).
**Impact:** Downstream plans 13-02 through 13-05 can still be implemented against the schema; the live DB column will be missing until `db push` is run.

### Pre-existing TypeScript errors (out of scope)

**Found during:** Task 2 verification
**Issue:** `npx tsc --noEmit` reports 20+ errors in untracked files from the worktree's prior state (`dismissedJob`, `savedJob` Prisma model references, `experienceLevel` field, `CategoriesSection`, `BoostJobButton`). These are pre-existing issues from other in-progress feature work, not caused by this plan.
**Fix:** Logged here for deferred handling. Not fixed (scope boundary: only fix issues directly caused by current task's changes).
**Files affected:** src/app/api/seeker/dismissed-jobs/, src/app/api/seeker/saved-jobs/, src/app/companies/, src/components/home/CategoriesSection.tsx, src/modules/admin/components/AdminJobPreview.tsx, src/modules/recruiter/jobs/components/BoostJobButton.tsx

## Known Stubs

None — this plan is schema-only. No UI rendering, no data source wiring needed.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. The `seekingStatus` column is enum-constrained at the DB level (T-13-01-01 mitigated by Prisma enum type).

## Self-Check: PASSED

- [x] `prisma/schema.prisma` modified — `enum SeekingStatus` and `User.seekingStatus` present
- [x] `src/constants/enums.ts` modified — `export enum SeekingStatus` and `SEEKING_STATUS_VALUES` present
- [x] Commit 4ac1a0c exists (Task 1)
- [x] Commit 1fce0b9 exists (Task 2)
- [x] `@prisma/client` exports `SeekingStatus` with correct 3 members
- [x] Default value is `OPEN_TO_OFFERS` (confirmed in schema and context)
- [ ] `npx prisma db push` — BLOCKED (environment limitation, not a code error)
