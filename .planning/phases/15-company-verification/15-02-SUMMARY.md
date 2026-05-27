---
phase: 15-company-verification
plan: "02"
subsystem: recruiter-settings
tags: [company-verification, settings, ui, service-layer]
dependency_graph:
  requires: [15-01a, 15-01b]
  provides: [CMPV-04]
  affects: [recruiter-settings-page]
tech_stack:
  added: []
  patterns: [TanStack-useMutation, RHF+Zod, sonner-toast, date-fns-format]
key_files:
  created:
    - src/modules/recruiter/settings/components/CompanyVerificationSection.tsx
  modified:
    - src/app/api/recruiter/settings/route.ts
    - src/services/recruiter.service.ts
    - src/modules/recruiter/settings/components/RecruiterSettingsClient.tsx
key_decisions:
  - "Service verifyCompany() returns DataResponse<> typed but raw route body at runtime; component casts to Record<string,unknown> to read verified/pending/message keys safely"
  - "PATCH handler intentionally NOT extended with companyVerified (T-15-08: server-authoritative)"
metrics:
  duration: "~15 min"
  completed: "2026-05-27"
  tasks_completed: 2
  files_changed: 4
---

# Phase 15 Plan 02: Company Verification Settings UI Summary

Company Verification settings section added to the recruiter settings page — self-serve verification with Level 1 (auto domain-check) and Level 2 (manual LinkedIn + work-email form).

## What Was Built

### Task 1 — Settings GET + Service Extension (a25ff70)

**`src/app/api/recruiter/settings/route.ts`**
- Added 4 fields to the Prisma `recruiterProfile.select`: `companyVerified`, `companyVerifiedAt`, `companyLinkedInUrl`, `companyWorkEmail`
- Added all 4 fields to the GET returned `data` object (`companyVerifiedAt` serialized via `.toISOString() ?? null`)
- PATCH handler left untouched — satisfies T-15-08 (elevation-of-privilege mitigation)

**`src/services/recruiter.service.ts`**
- Extended `RecruiterSettingsData` interface with 4 typed fields: `companyVerified: boolean`, `companyVerifiedAt: string | null`, `companyLinkedInUrl: string | null`, `companyWorkEmail: string | null`
- Added `verifyCompany()` method to `recruiterService` posting to `/recruiter/verify-company` with optional Level 2 body

### Task 2 — CompanyVerificationSection Component + Wiring (1eb3c67)

**`src/modules/recruiter/settings/components/CompanyVerificationSection.tsx`** (250 lines)
- `"use client"` component with full `/* */` comment block
- Three exclusive states rendered based on `settings.companyVerified` and `settings.companyWorkEmail`:
  1. **VERIFIED**: green `CheckCircle2` badge + `format(companyVerifiedAt, "MMM d, yyyy")` date
  2. **PENDING**: amber `Clock` badge + under-review message
  3. **NOT VERIFIED**: gray `ShieldQuestion` badge, then:
     - Corporate email (`!isFreemail`): explanatory text + "Verify company" primary Button calling `verifyMutation.mutate(undefined)`; Level 1 result messages (no_website / mismatch) shown inline
     - Freemail: RHF form with `Level2SubmitSchema` zodResolver, two `Input` fields (companyLinkedInUrl, companyWorkEmail), "Submit for review" Button
- `useMutation` calls `recruiterService.verifyCompany()`, invalidates `["recruiter-settings"]` on success, toasts via sonner
- Mobile-first layout: single column base, `md:grid-cols-2` for Level 2 form inputs

**`src/modules/recruiter/settings/components/RecruiterSettingsClient.tsx`**
- Added `import { CompanyVerificationSection }` 
- Added `<CompanyVerificationSection settings={settings} />` after `<CompanyProfileSection>`
- Added `<SettingsSectionSkeleton fieldCount={2} />` to loading state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Route response shape vs service typing mismatch**
- **Found during:** Task 2 implementation
- **Issue:** The plan's interface comments show `{ data: { level, status } }` but the actual route (Plan 01b) returns `{ level, verified, pending }` directly. The service types `DataResponse<{level,status,message?}>` but the runtime response has different keys.
- **Fix:** Component casts `response as unknown as Record<string, unknown>` and reads `raw.verified`, `raw.alreadyVerified`, `raw.pending`, `raw.message` — handles all actual route response shapes without altering the service typing or the route.
- **Files modified:** `CompanyVerificationSection.tsx` only
- **Commit:** 1eb3c67

## Known Stubs

None — all three states are wired to real data from the settings query. Level 1 and Level 2 paths call the live `/api/recruiter/verify-company` endpoint.

## Threat Flags

None — no new network endpoints or auth paths introduced. The GET expansion is scoped to the existing auth+role guard; PATCH intentionally excludes companyVerified per T-15-08.

## Self-Check: PASSED

- CompanyVerificationSection.tsx exists: FOUND
- RecruiterSettingsClient.tsx wires it: FOUND (grep confirmed)
- Commits a25ff70 and 1eb3c67: FOUND in git log
- `npx tsc --noEmit`: CLEAN (no errors)
- PATCH handler does NOT contain companyVerified: CONFIRMED (grep lines 45-46, 76-77 only in GET)
