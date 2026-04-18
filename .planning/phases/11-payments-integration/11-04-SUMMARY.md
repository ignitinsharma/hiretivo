---
phase: 11-payments-integration
plan: "04"
subsystem: payments
tags: [requirements, roadmap, stripe, enterprise, gap-closure]
dependency_graph:
  requires:
    - 11-01 established Enterprise as contact-sales only
    - 11-02 implemented PRO-only checkout
    - 11-03 completed billing management and delete-account cancellation
  provides:
    - PAY-01 wording aligned to shipped billing model
    - Phase 11 roadmap success criteria aligned to shipped billing model
  affects:
    - Phase 11 verification
    - requirements traceability
tech_stack:
  added: []
  patterns:
    - Requirements and roadmap language must match shipped product behavior
key_files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
decisions:
  - "Enterprise remains contact-sales only; Phase 11 does not add self-serve Enterprise checkout."
  - "PAY-01 now defines PRO as the self-serve Stripe Checkout path and Enterprise as contact-sales."
metrics:
  duration: "~10 minutes"
  completed_date: "2026-04-17"
  tasks_completed: 1
  files_changed: 2
---

# Phase 11 Plan 04: Payments Contract Alignment Summary

**One-liner:** PAY-01 and the Phase 11 roadmap now match the shipped billing model: PRO is self-serve via Stripe Checkout, while Enterprise routes to contact sales.

## What Was Built

### Task 1: Align PAY-01 and Phase 11 roadmap wording

- Updated `PAY-01` in `.planning/REQUIREMENTS.md` to define PRO as the Stripe Checkout plan and Enterprise as contact-sales only.
- Updated the top Phase 11 roadmap milestone summary to describe PRO checkout and Enterprise contact-sales explicitly.
- Updated Phase 11 success criterion 1 to remove the incorrect Enterprise self-serve checkout claim.
- Updated the Phase 11 plan listing to include the gap-closure plan.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## Verification

- PASSED: `grep -F 'Recruiter can purchase PRO plan via Stripe Checkout; Enterprise routes to contact sales' .planning/REQUIREMENTS.md`
- PASSED: `grep -F 'Recruiter can select PRO on the pricing page, complete Stripe Checkout, and return to the app with their plan upgraded; Enterprise routes to contact sales' .planning/ROADMAP.md`
- PASSED: `grep -F 'PRO Stripe checkout, webhooks, customer portal, billing tab, Enterprise contact-sales' .planning/ROADMAP.md`
- PASSED: `! rg -n 'purchase PRO or ENTERPRISE plan via Stripe Checkout|select PRO or ENTERPRISE on the pricing page, complete Stripe Checkout' .planning/REQUIREMENTS.md .planning/ROADMAP.md`
- PASSED: `grep -F 'cta: "Contact sales"' src/constants/pricing.ts`
- PASSED: `grep -F 'planId: z.enum(["pro"])' src/lib/validations/checkout.schema.ts`

## Next Phase Readiness

Phase 11 is ready for re-verification. The remaining work is to regenerate the verification artifact against the corrected PAY-01 contract and confirm the phase passes.

## Self-Check

- FOUND: .planning/REQUIREMENTS.md
- FOUND: .planning/ROADMAP.md
- FOUND: commit 89f7683 (Task 1)

**Status: PASSED**
