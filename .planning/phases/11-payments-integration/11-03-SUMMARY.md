---
phase: 11-payments-integration
plan: "03"
subsystem: payments
tags: [billing, stripe, settings, subscription, account-deletion]
dependency_graph:
  requires:
    - 11-02 subscription-status API and Stripe Customer Portal API
  provides:
    - src/modules/billing/components/BillingTabContent.tsx (real recruiter billing tab)
    - src/app/recruiter/settings/page.tsx (billing tab wiring)
    - src/app/api/auth/delete-account/route.ts (Stripe cancellation before soft delete)
  affects:
    - recruiter settings
    - account deletion
tech_stack:
  added: []
  patterns:
    - Billing module component owns subscription query and portal mutation
    - Delete account flow cancels active Stripe subscription without blocking deletion on Stripe failure
key_files:
  created:
    - src/modules/billing/components/BillingTabContent.tsx
  modified:
    - src/app/recruiter/settings/page.tsx
    - src/app/api/auth/delete-account/route.ts
decisions:
  - "BillingTabContent lives under src/modules/billing/components as a domain-specific module component."
  - "FREE users route to /pricing from the billing tab instead of creating checkout directly."
  - "Enterprise users can use the same portal flow when a Stripe customer exists."
  - "Stripe cancellation errors are logged and do not block local account deletion."
metrics:
  duration: "~20 minutes"
  completed_date: "2026-04-17"
  tasks_completed: 2
  files_changed: 3
---

# Phase 11 Plan 03: Recruiter Billing Tab and Account Deletion Summary

**One-liner:** Recruiter settings now has a real billing tab backed by subscription status and Customer Portal APIs, and account deletion cancels active Stripe subscriptions before soft deletion.

## What Was Built

### Task 1: BillingTabContent

- Created `src/modules/billing/components/BillingTabContent.tsx`.
- Replaced the settings billing placeholder with `<BillingTabContent />`.
- Added subscription-status query states:
  - loading skeletons
  - retryable error state
  - Free, PRO, and Enterprise plan cards
- FREE recruiters see plan limits and an "Upgrade to PRO" CTA to `/pricing`.
- PRO recruiters see status badge, renewal/expiry date, cancel-at-period-end messaging, and a "Manage billing" button.
- Manage billing uses `POST /api/stripe/portal` and redirects to the returned Stripe-hosted portal URL.

### Task 2: Delete Account Stripe Cancellation

- Imported the Stripe server client into `src/app/api/auth/delete-account/route.ts`.
- Before soft deletion, the route lists the user's active Stripe subscription and cancels it with `stripe.subscriptions.cancel(..., { prorate: true })`.
- Cancellation is wrapped in try/catch and logs errors without blocking deletion.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- Full `pnpm exec tsc --noEmit` remains blocked by existing repo-level issues unrelated to this plan:
  - stale `.next/types` references for deleted `early-access` and `recruiter/talent` routes
  - missing `@radix-ui/react-alert-dialog`
- The GSD key-link verifier checks `src/app/recruiter/settings/page.tsx` directly and does not follow the imported `BillingTabContent` module, so the direct plan grep checks were used for this plan.

## Verification

- PASSED: `test -f src/modules/billing/components/BillingTabContent.tsx`
- PASSED: `grep -q "BillingTabContent" src/app/recruiter/settings/page.tsx`
- PASSED: `grep -q "subscription-status" src/modules/billing/components/BillingTabContent.tsx`
- PASSED: `grep -q "stripe/portal" src/modules/billing/components/BillingTabContent.tsx`
- PASSED: `grep -q "PlanTier" src/modules/billing/components/BillingTabContent.tsx`
- PASSED: `! grep -q "Coming soon" src/app/recruiter/settings/page.tsx`
- PASSED: `grep -q "stripe.subscriptions.cancel" src/app/api/auth/delete-account/route.ts`
- PASSED: `grep -q "prorate" src/app/api/auth/delete-account/route.ts`
- PARTIAL: Full TypeScript check blocked by existing repo-level issues listed above.

## Next Phase Readiness

Phase 11 implementation is complete and ready for phase-level verification. Billing UI depends on the Stripe APIs from Plan 11-02 and is wired for the recruiter settings tab.

## Self-Check

- FOUND: src/modules/billing/components/BillingTabContent.tsx
- FOUND: src/app/recruiter/settings/page.tsx
- FOUND: src/app/api/auth/delete-account/route.ts
- FOUND: commit 7eefcdd (Task 1)
- FOUND: commit 25f3767 (Task 2)

**Status: PASSED**
