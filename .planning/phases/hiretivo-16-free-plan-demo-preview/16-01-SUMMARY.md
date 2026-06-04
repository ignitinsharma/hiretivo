---
phase: 16-free-plan-demo-preview
plan: "01"
subsystem: recruiter-talent
tags: [demo, free-plan, talent-pool, blurred-items, api-contract]
dependency_graph:
  requires: []
  provides: [DEMO_ENGINEERS constant, DemoEngineerProfile type, DEMO_THRESHOLD, TalentListResponse.demoCount, TalentListResponse.isFreePlan, blurred-items FREE plan API]
  affects: [Plan 02 (DemoEngineerCard UI), Plan 03 (TalentPoolClient mix-mode)]
tech_stack:
  added: []
  patterns: [server-side name blurring, demoCount unfiltered count, isFreePlan flag in API response]
key_files:
  created:
    - src/constants/demo-engineers.ts
  modified:
    - src/modules/recruiter/talent/types/talent.types.ts
    - src/app/api/recruiter/talent/route.ts
    - src/services/recruiter.service.ts
decisions:
  - "FREE plan talent API now returns 200 with blurred items instead of 403 — enables mix-mode UI in Plan 02/03"
  - "demoCount is computed before the plan check so it reflects real pool size regardless of FREE/paid path"
  - "Name blurring is server-side ('Priya Sharma' -> 'Priya S.') with email=null and image=null enforced at API layer"
  - "TalentForbiddenError 403 throw removed from recruiter.service.ts getTalent — dead code after API change"
  - "DEMO_ENGINEERS array uses 'as const' assertion; type is DemoEngineerProfile[] for downstream consumers"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-06-01"
  tasks: 2
  files_changed: 4
  files_created: 1
---

# Phase 16 Plan 01: Demo Engineers Constant + FREE Plan API Contract Summary

**One-liner:** Static DEMO_ENGINEERS constant (6 profiles) + FREE plan talent API returns blurred real items with isFreePlan:true instead of 403, enabling downstream mix-mode UI.

## What Was Built

### Task 1: src/constants/demo-engineers.ts

Created the static demo engineer profiles constant file with:
- `DemoEngineerProfile` interface with all required fields (id, name, headline, skills, hiretivoScore, salaryRange, timezoneOverlap, availability, seekingStatus, yearsExperience)
- `DEMO_ENGINEERS` array with exactly 6 realistic Indian engineer profiles matching CONTEXT.md D-02 specification:
  - Priya Sharma (React/Node.js/AWS, score 88)
  - Rahul Mehta (Python/Django/PostgreSQL, score 79)
  - Ananya Krishnan (Go/Kubernetes/GCP, score 91)
  - Vikram Nair (Java/Spring Boot/Kafka, score 84)
  - Sneha Patel (Flutter/Dart/Firebase, score 74)
  - Arjun Desai (TypeScript/Next.js/Prisma, score 81)
- `DEMO_THRESHOLD = 6` exported for mix-mode logic in TalentPoolClient

### Task 2: API contract + type updates

**talent.types.ts** — Extended `TalentListResponse.data` with:
- `demoCount: number` — real pool size, unaffected by search filters
- `isFreePlan: boolean` — true when caller is on FREE plan (blurred items), false for paid

**src/app/api/recruiter/talent/route.ts** — Replaced the FREE plan 403 block with:
- `prisma.user.count` for `demoCount` runs before the plan check (both paths need it)
- FREE plan path: fetches up to `DEMO_THRESHOLD` real seekers, blurs names server-side ("First L."), sets email=null, image=null, returns 200 with `isFreePlan: true`
- Paid plan path: unchanged seeker query, but response now includes `demoCount` and `isFreePlan: false`
- Import `DEMO_THRESHOLD` from `@/constants/demo-engineers`

**src/services/recruiter.service.ts** — Removed dead `TalentForbiddenError` 403 throw from `getTalent` method. FREE plan no longer returns 403, so the catch block was dead code.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria passed.

## Threat Mitigations Applied

Per plan threat model:
- **T-16-01 (Info Disclosure):** Names blurred to "First L." server-side. email=null and image=null enforced. Skills/availability remain visible as non-PII.
- **T-16-02 (DoS):** `demoCount` count query runs after `searchRateLimiter.limit()` check. Count is O(index) on seekerProfile presence.

## TypeScript Notes

Pre-existing TypeScript errors exist in unrelated files (`pricing-client.tsx`, `webhook/route.ts`, `auth.ts`, etc.) from the pivot plan-tier rename (PRO/ENTERPRISE removed). These are out-of-scope for this plan. Files modified by this plan (`demo-engineers.ts`, `talent.types.ts`, `route.ts`, `recruiter.service.ts`) compile clean with no errors.

## Known Stubs

None — all data contracts are fully wired. `demoCount` and `isFreePlan` fields are live values from the API, not placeholders.

## Self-Check: PASSED

Files exist:
- src/constants/demo-engineers.ts: FOUND
- src/modules/recruiter/talent/types/talent.types.ts: FOUND (demoCount + isFreePlan fields added)
- src/app/api/recruiter/talent/route.ts: FOUND (blurred items path + demoCount + isFreePlan)
- src/services/recruiter.service.ts: FOUND (403 throw removed)

Commits:
- 4d49b22: feat(16-01): add DEMO_ENGINEERS constant with 6 static engineer profiles
- 66a5635: feat(16-01): add isFreePlan+demoCount to talent API; return blurred items for FREE plan
