---
phase: 08-paid-workflows-account-completion
plan: 05
subsystem: recruiter-settings-integration
tags:
  - recruiter-settings
  - billing
  - paid-workflows
  - layout
key-files:
  created:
    - src/modules/recruiter/settings/components/RecruiterSettingsClient.tsx
    - src/modules/recruiter/settings/components/RecruiterBillingSection.tsx
    - src/modules/recruiter/settings/components/CompanyAvatarSection.tsx
    - src/modules/recruiter/settings/components/CompanyProfileSection.tsx
    - src/modules/recruiter/settings/components/RecruiterProfileSection.tsx
  modified:
    - src/app/api/recruiter/settings/route.ts
    - src/app/recruiter/layout.tsx
    - src/app/recruiter/settings/page.tsx
    - src/components/layout/RecruiterSidebar.tsx
    - src/lib/validations/interview.schema.ts
    - src/services/recruiter.service.ts
metrics:
  tasks: 4
  commits: 1
---

# Plan 08-05 Summary

## What Changed

- Expanded recruiter settings API responses with read-only plan/billing data and editable recruiter profile/company fields.
- Added recruiter settings tabs for company profile, recruiter profile, billing, notification preferences, and company logo upload.
- Mounted the shared `PaidFeatureModal` once in recruiter layout.
- Hid recruiter sidebar/header chrome on exact `/recruiter/settings` and `/recruiter/talent` routes while leaving other recruiter pages unchanged.
- Kept plan and billing customer fields read-only by excluding them from settings PATCH updates.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1-4 | `37aded5` | Add recruiter settings integration |

## Verification

Passed:

- `pnpm db:generate`
- `pnpm lint`
- `pnpm tsc --noEmit -p tsconfig.json`
- `pnpm build`
- `rg "plan|billingCustomerId|fundingType|isFullyRemote|UserRole.RECRUITER" src/app/api/recruiter/settings/route.ts`
- `rg "RecruiterSettingsClient|RecruiterBillingSection|CompanyAvatarSection|/api/billing/checkout|/api/upload/avatar|hover:scale-105" src/app/recruiter/settings/page.tsx src/modules/recruiter/settings`
- `rg "usePathname|PaidFeatureModal|/recruiter/settings|/recruiter/talent|RecruiterHeader" src/app/recruiter src/components/layout`
- `rg "MOCK_TALENT" src/app/recruiter/talent/page.tsx` returns no matches
- `rg "BillingSection|DangerZoneSection" src/app/seeker/settings/page.tsx` returns no matches
- `rg "RecruiterHeader" src/app/recruiter/settings/page.tsx src/app/recruiter/talent/page.tsx` returns no matches
- `rg "PaidFeatureModal" src/app/recruiter/layout.tsx`
- `rg "canAccessRecruiterPaidFeature" src/app/api/recruiter/talent src/app/api/recruiter/interviews src/app/api/recruiter/applications src/lib/billing/plan-access.ts`

Warnings observed:

- Local Node is `v20.19.0`; package engine requests Node `22.x`.
- `pnpm build` skipped optimization for the external Google Material Symbols stylesheet because the sandbox could not fetch it.
- `pnpm build` logged existing `metadataBase` default warnings and transient Neon reachability errors during static generation, but completed with exit code 0.

## Deviations

- The company logo section uses the shared upload service for the company-logo target instead of posting directly from the component, preserving the existing upload abstraction.
- Route chrome hiding was implemented in `RecruiterSidebarProvider`, the existing recruiter layout client wrapper, to avoid adding another layout wrapper.

## Self-Check: PASSED

Recruiter settings now supports account/profile completion and billing upgrade entry points, paid recruiter modal wiring remains mounted, and settings/talent routes render without recruiter chrome.
