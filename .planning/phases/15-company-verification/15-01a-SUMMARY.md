---
phase: 15-company-verification
plan: 01a
subsystem: company-verification
tags: [schema, utilities, validation, email]
dependency_graph:
  requires: []
  provides: [RecruiterProfile-verification-fields, domain-freemail-utilities, verification-schemas, admin-notification-email]
  affects: [prisma/schema.prisma]
tech_stack:
  added: []
  patterns: [WHATWG-URL-hostname-extraction, Zod-refine-validation, Resend-email-pattern]
key_files:
  created:
    - src/lib/company-verification.ts
    - src/lib/validations/company-verification.schema.ts
    - src/lib/email/company-verification.ts
  modified:
    - prisma/schema.prisma
decisions:
  - Boolean flag companyVerified sufficient — no CompanyVerificationStatus enum needed
  - WHATWG URL API used for domain extraction — no regex, handles edge cases (missing scheme, www, paths)
  - sendCompanyVerificationAdminEmail returns early (no-op) when ADMIN_EMAIL is unset
metrics:
  duration: "~8 minutes"
  completed: "2026-05-27"
  tasks: 4
  files: 4
---

# Phase 15 Plan 01a: Company Verification Foundation Summary

**One-liner:** RecruiterProfile extended with 4 verification fields; domain/freemail utility lib, Zod schemas, and admin notification email helper ready for API routes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend RecruiterProfile schema | 5b494cb | prisma/schema.prisma |
| 2 | Push schema to Neon | BLOCKED | — DB unreachable (known blocker) |
| 3 | Domain/freemail utility lib and Zod schemas | 003a8b2 | src/lib/company-verification.ts, src/lib/validations/company-verification.schema.ts |
| 4 | Admin notification email helper | 5e552a2 | src/lib/email/company-verification.ts |

## Artifacts Produced

### prisma/schema.prisma
Added 4 fields to RecruiterProfile after `logo String?`:
- `companyVerified    Boolean   @default(false)`
- `companyVerifiedAt  DateTime?`
- `companyLinkedInUrl String?`
- `companyWorkEmail   String?`

No new model or enum introduced. All existing rows default safely to `companyVerified=false` and nulls.

### src/lib/company-verification.ts
Exports:
- `FREEMAIL_DOMAINS` — Set of 11 personal email providers
- `extractDomain(url)` — WHATWG URL hostname extraction, strips www, handles missing scheme
- `isFreemailDomain(email)` — checks email domain against FREEMAIL_DOMAINS
- `checkLevel1Match(email, websiteUrl)` — exact domain equality (subdomain mismatch = false)

### src/lib/validations/company-verification.schema.ts
Exports:
- `Level2SubmitSchema` — Zod object: companyLinkedInUrl (URL + linkedin.com refine) + companyWorkEmail (email)
- `AdminReviewSchema` — Zod object: action enum(approve, reject)
- `Level2SubmitInput` / `AdminReviewInput` — inferred types

### src/lib/email/company-verification.ts
Exports:
- `sendCompanyVerificationAdminEmail({ recruiterName, companyName, companyLinkedInUrl, companyWorkEmail })` — async, returns void, no-op when ADMIN_EMAIL unset

## Deviations from Plan

### Blocking Issue — Task 2: DB Push Unreachable

**Found during:** Task 2
**Issue:** `pnpm exec prisma db push` failed with `P1001: Can't reach database server at ep-hidden-haze-a18fvg88-pooler.ap-southeast-1.aws.neon.tech:5432`. The worktree also has no node_modules; used main repo prisma binary as workaround for the generate step.
**Fix:** Ran `prisma generate` successfully — Prisma client now includes `companyVerified` field types. DB push must be run manually when Neon connectivity is restored.
**Impact:** Schema is correct in the codebase; TypeScript types are correct via client regeneration. Only the live Neon DB columns are missing until push is run.
**Manual step required:** `pnpm exec prisma db push` from the main repo once Neon is reachable.

This is the pre-documented STATE.md blocker: "Live Prisma migration/push requires a reachable Neon DATABASE_URL."

## Threat Surface Scan

All mitigations from `<threat_model>` were implemented:

| Threat ID | Mitigation Applied |
|-----------|--------------------|
| T-15-02 | `new URL(withScheme).hostname` in extractDomain — path/query cannot affect hostname comparison |
| T-15-03 | Zod `.url()` + `.refine(url => url.includes("linkedin.com"))` in Level2SubmitSchema |
| T-15-07 | Accepted — companyWorkEmail is informational only, admin manual review required |

No new threat surface introduced beyond what was planned.

## Known Stubs

None — all files are fully implemented with no placeholder data.

## Self-Check: PASSED

- [x] `src/lib/company-verification.ts` — exists, exports FREEMAIL_DOMAINS, extractDomain, isFreemailDomain, checkLevel1Match
- [x] `src/lib/validations/company-verification.schema.ts` — exists, exports Level2SubmitSchema, AdminReviewSchema
- [x] `src/lib/email/company-verification.ts` — exists, exports sendCompanyVerificationAdminEmail
- [x] `prisma/schema.prisma` — contains all 4 new RecruiterProfile fields
- [x] Commits 5b494cb, 003a8b2, 5e552a2 exist in git log
- [x] No TypeScript errors introduced in new files (verified via `tsc --noEmit | grep company-verification`)
