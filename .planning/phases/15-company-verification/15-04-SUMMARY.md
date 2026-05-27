---
phase: 15
plan: "15-04"
subsystem: company-verification
tags: [gap-closure, api, security, prisma]
dependency_graph:
  requires: [15-01a, 15-01b]
  provides: [CMPV-02-complete, CMPV-06-complete]
  affects: [verify-company-route, admin-patch-route]
tech_stack:
  added: []
  patterns: [tamper-guard, early-return-guard, edge-case-branch]
key_files:
  created: []
  modified:
    - src/app/api/recruiter/verify-company/route.ts
    - src/app/api/admin/companies/[id]/route.ts
decisions:
  - "prisma db push with --accept-data-loss requires explicit user authorization due to data-loss warnings on unrelated columns; 4 company verification columns are additive and would push cleanly with that flag"
  - "Corporate-email path uses a fully explicit if/else structure rather than a single combined condition to ensure all sub-cases return descriptive statuses"
  - "already_pending guard placed before req.json() to prevent body parse overhead and avoid any accidental overwrite of prior pending data"
metrics:
  duration: "~20 min"
  completed: "2026-05-27"
  tasks_completed: 2
  tasks_blocked: 1
  files_modified: 2
requirements:
  - CMPV-01 (partial — DB push still blocked)
  - CMPV-02 (closed)
  - CMPV-06 (closed)
---

# Phase 15 Plan 04: Gap Closure — Verification Route Edge Cases and Admin Tamper Guard

**One-liner:** Added no_website/mismatch/already_pending response branches to verify-company route and non-pending 404 tamper guard (T-15-05) to admin PATCH route; DB push blocked pending user authorization for data-loss warnings on unrelated columns.

## What Was Built

### Task 2 — verify-company route edge cases (CMPV-02) — COMPLETE

`src/app/api/recruiter/verify-company/route.ts` received 4 targeted changes:

1. Added `companyWorkEmail: true` to the profile select so the already_pending guard can read the field.
2. Updated the `/* */` handler comment to describe all 5 response branches.
3. Replaced the single `if (!isFreemail && websiteUrl && checkLevel1Match(...))` condition with an explicit `if (!isFreemail) { ... }` block that handles all three corporate-email sub-cases:
   - Returns `{ level: 1, status: "no_website" }` when `websiteUrl` is empty.
   - Returns `{ level: 1, status: "mismatch" }` when `checkLevel1Match` returns false.
   - Auto-verifies and returns `{ level: 1, status: "verified", verified: true }` on domain match.
   - Corporate-email path always returns; never falls through to Level 2 body parsing.
4. Added `already_pending` guard at the start of the freemail path (before `req.json()`) that returns `{ level: 2, status: "already_pending" }` when `recruiterProfile.companyWorkEmail` is already set, preventing overwrite of prior pending data and duplicate admin emails.

Commit: `53032fd`

### Task 3 — admin PATCH tamper guard (CMPV-06 / T-15-05) — COMPLETE

`src/app/api/admin/companies/[id]/route.ts` received 2 targeted changes:

1. Broadened findUnique select from `{ id: true }` to `{ id: true, companyWorkEmail: true, companyVerified: true }`.
2. Replaced existence-only guard (`if (!profile)`) with the full tamper guard:
   ```typescript
   if (!profile || profile.companyVerified || !profile.companyWorkEmail) {
     return NextResponse.json(
       { error: "No pending verification for this company" },
       { status: 404 }
     );
   }
   ```
   This returns 404 for: non-existent records, already-verified records, and records that never submitted Level 2. Only genuinely pending records proceed to approve/reject.

Commit: `56ae564`

### Task 1 — DB push (CMPV-01) — BLOCKED (user action required)

The Neon DB was reachable (`ep-hidden-haze-a18fvg88-pooler.ap-southeast-1.aws.neon.tech`). However, `pnpm exec prisma db push` requires `--accept-data-loss` because the current schema diverges from the live DB on columns unrelated to the 4 company verification fields:

**Columns that would be dropped (contain live data):**
- `Job.isRemoteOnly` (7 non-null rows)
- `SeekerProfile.githubUsername`, `.profilePublic`, `.salaryMaxUsd`, `.salaryMinUsd`, `.topProjects`, `.videoIntroUrl` (1 non-null row each)
- `User.availableFrom`, `.timezoneOverlapHours` (1 non-null row each)
- `User.verificationStatus` (8 non-null rows)
- `VerificationReview` table (1 row)
- `PlanTier` enum values `STARTER`, `GROWTH`, `SCALE` would be removed

The 4 company verification columns (`companyVerified`, `companyVerifiedAt`, `companyLinkedInUrl`, `companyWorkEmail`) are all additive and NOT in the warning list. They would be applied cleanly.

**To unblock:** Run `pnpm exec prisma db push --accept-data-loss` from the repo root after confirming the data-loss columns are safe to drop (they are schema leftovers from earlier phases of the Pivot v2 redesign). This is a user decision, not an automated action.

## Deviations from Plan

### Auth Gates / Blockers

**Task 1 — DB push requires --accept-data-loss authorization**
- **Found during:** Task 1 execution
- **Issue:** `pnpm exec prisma db push` refused to proceed without `--accept-data-loss` flag due to schema drift on unrelated columns. The 4 target columns are additive and safe, but the flag authorizes dropping columns with live data.
- **Classification:** Rule 4 — architectural decision (data loss, user authorization required)
- **Status:** Re-surfaced to user. Task 1 remains open until user runs `pnpm exec prisma db push --accept-data-loss` manually.
- **Impact on Tasks 2+3:** None — both tasks are pure TypeScript edits that compile against the already-generated Prisma client.

## Known Stubs

None. Both route files produce real DB reads/writes. No placeholder data.

## Threat Flags

None. Both changes reduce attack surface (tamper guard added, DoS vector closed).

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| CMPV-01 | PARTIAL | 4 fields in schema.prisma and Prisma client; live DB push still blocked (--accept-data-loss required) |
| CMPV-02 | CLOSED | verify-company route now returns no_website/mismatch/already_pending with descriptive messages; tsc clean |
| CMPV-06 | CLOSED | admin PATCH returns 404 for non-pending records; T-15-05 tamper guard implemented; tsc clean |

## Self-Check

- [x] `src/app/api/recruiter/verify-company/route.ts` — modified, grep checks pass
- [x] `src/app/api/admin/companies/[id]/route.ts` — modified, grep checks pass
- [x] Commit `53032fd` — exists (`git log --oneline` confirms)
- [x] Commit `56ae564` — exists (`git log --oneline` confirms)
- [x] TypeScript check — no errors for either route file (tsc --noEmit grep returned CLEAN)

## Self-Check: PASSED
