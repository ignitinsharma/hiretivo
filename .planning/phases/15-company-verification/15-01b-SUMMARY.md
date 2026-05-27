---
phase: 15-company-verification
plan: 01b
subsystem: company-verification
tags: [api, admin, recruiter, verification]
dependency_graph:
  requires: [15-01a]
  provides: [verify-company-api, admin-companies-api, admin-companies-page, admin-nav-update]
  affects:
    - src/app/api/recruiter/verify-company/route.ts
    - src/app/api/admin/companies/route.ts
    - src/app/api/admin/companies/[id]/route.ts
    - src/modules/admin/components/AdminShell.tsx
tech_stack:
  added: []
  patterns: [TanStack-Query-useMutation, admin-email-gate, rate-limited-api, Zod-validation]
key_files:
  created:
    - src/app/api/recruiter/verify-company/route.ts
    - src/app/api/admin/companies/route.ts
    - src/app/api/admin/companies/[id]/route.ts
    - src/modules/admin/types/admin-company.types.ts
    - src/modules/admin/hooks/use-admin-companies.ts
    - src/modules/admin/components/AdminCompaniesList.tsx
    - src/app/admin/companies/page.tsx
  modified:
    - src/modules/admin/components/AdminShell.tsx
decisions:
  - Level 2 reject clears both companyLinkedInUrl and companyWorkEmail to allow clean re-submission
  - Admin companies GET returns both pending and verified records for full audit visibility
  - verifyCompanyLimiter uses writeRateLimiter threshold (5/min) matching CLAUDE.md write operations rule
metrics:
  duration: "~3 minutes"
  completed: "2026-05-27"
  tasks: 4
  files: 8
---

# Phase 15 Plan 01b: Company Verification API Routes & Admin Page Summary

**One-liner:** Recruiter verify-company API (Level 1 auto + Level 2 manual), admin companies review API + table page, and AdminShell nav update wired to Wave 1 utilities.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | POST /api/recruiter/verify-company | 79f429e | src/app/api/recruiter/verify-company/route.ts |
| 2 | GET+PATCH /api/admin/companies | f4e5fe6 | src/app/api/admin/companies/route.ts, src/app/api/admin/companies/[id]/route.ts |
| 3 | Admin companies page + components | 45ee713 | AdminCompaniesList.tsx, use-admin-companies.ts, admin-company.types.ts, /admin/companies/page.tsx |
| 4 | AdminShell nav update | fa4262b | src/modules/admin/components/AdminShell.tsx |

## Artifacts Produced

### POST /api/recruiter/verify-company

Level 1 auto-verification: calls `checkLevel1Match(email, websiteUrl)` from Wave 1 lib. If email domain == company website domain (non-freemail), sets `companyVerified=true` + `companyVerifiedAt=now()` immediately.

Level 2 manual submission: validates `{ companyLinkedInUrl, companyWorkEmail }` via `Level2SubmitSchema`, stores both fields on the RecruiterProfile, triggers `sendCompanyVerificationAdminEmail()` to notify admin. Returns `{ level: 2, pending: true }`.

Rate limited 5/min per user (write tier). Auth+RECRUITER-role gated.

### GET /api/admin/companies

Returns all RecruiterProfile records with `companyLinkedInUrl OR companyWorkEmail OR companyVerified=true`, ordered by `updatedAt desc`. Admin-email gated via `isAdminSession()`. Rate limited 60/min (read tier).

### PATCH /api/admin/companies/[id]

Validates `{ action: "approve" | "reject" }` via `AdminReviewSchema`. Approve: sets `companyVerified=true` + `companyVerifiedAt`. Reject: clears `companyLinkedInUrl` and `companyWorkEmail` for clean re-submission. Admin-email gated. Rate limited 30/min.

### AdminCompaniesList + hooks

Table component with pending/verified/not-submitted badge, approve/reject row actions, per-row loading state scoped with `pendingId`. Uses `useAdminCompanies` (TanStack Query, 30s staleTime) and `useReviewCompany` mutation with query invalidation. Follows DRY pattern — column headings via `.map()`, table cells extracted to `CompanyRow` sub-component.

### AdminShell nav update

Added `{ href: "/admin/companies", label: "Companies" }` to NAV array. Existing `isActive` logic handles route highlighting correctly via `pathname.startsWith(href + "/")`.

## Deviations from Plan

None — plan executed exactly as intended. All Wave 1 imports (company-verification.ts, company-verification.schema.ts, email/company-verification.ts) resolved correctly.

## Known Stubs

None — all endpoints are fully implemented with real DB queries and validation.

## Threat Surface Scan

New surface introduced:

| Flag | File | Description |
|------|------|-------------|
| threat_flag: write-endpoint | src/app/api/recruiter/verify-company/route.ts | POST by authenticated RECRUITER; rate-limited 5/min; Zod-validated Level 2 body; idempotent on already-verified |
| threat_flag: admin-write-endpoint | src/app/api/admin/companies/[id]/route.ts | PATCH by admin-email-gated session; rate-limited 30/min; Zod-validated action enum; 404 guard before update |

Both mitigations were applied inline (auth gate + rate limit + Zod validation) — no new unmitigated surface.

## Self-Check: PASSED

- [x] `src/app/api/recruiter/verify-company/route.ts` — exists
- [x] `src/app/api/admin/companies/route.ts` — exists
- [x] `src/app/api/admin/companies/[id]/route.ts` — exists
- [x] `src/modules/admin/types/admin-company.types.ts` — exists
- [x] `src/modules/admin/hooks/use-admin-companies.ts` — exists
- [x] `src/modules/admin/components/AdminCompaniesList.tsx` — exists
- [x] `src/app/admin/companies/page.tsx` — exists
- [x] `src/modules/admin/components/AdminShell.tsx` — modified (Companies nav item added)
- [x] Commits 79f429e, f4e5fe6, 45ee713, fa4262b exist in git log
- [x] No TypeScript errors in source files (only pre-existing .next stale cache errors)
